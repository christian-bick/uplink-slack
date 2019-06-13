import store from '../store'
import { slackLog } from '../logger'

export const buildCannotConnectToYourselfMessage = (contactEmail) => {
  return `Looks like this your own email address: ${contactEmail}`
}

export const buildContactNotFoundMessage = (contactEmail) => {
  return `I don't know a user with this email address: ${contactEmail}`
}

export const buildGroupAlreadyExistsMessage = (groupName) => {
  return `We found an existing group with a conversation with this contact: ${groupName}`
}

export const buildGroupCreatedMessage = (groupName) => {
  return `We created a new group for your conversation with this contact: ${groupName}`
}

export const buildFailedToCreateGroup = (reason) => `Failed to create a group (${reason})`

export const generateChatName = (email) => {
  const withoutEmail = email.split('@')[0]
  const hyphened = withoutEmail.replace(/[._]/g, '-')
  return hyphened.substr(0, 21)
}

export const generateNextCandidate = (name, attempt) => {
  if (attempt === 0) {
    return name
  }
  const iterator = generateNextIterator(attempt)
  return name.substr(0, 17).concat(`-${iterator}`)
}

export const generateNextIterator = (attempt) => {
  const min = 100 // inclusive
  const max = 1000 // exclusive
  const randomProbability = Math.random()
  const randomNumber = (randomProbability * (max - min)) + min
  return Math.floor(randomNumber)
}

export const openChat = (app) => async ({ body, context, ack, say }) => {
  ack()

  const contactEmail = body.submission.email

  const profileInfo = await app.client.users.profile.get({
    token: context.userToken,
    user: context.userId
  })

  const userEmail = profileInfo.profile.email
  if (userEmail === contactEmail) {
    say(buildCannotConnectToYourselfMessage(contactEmail))
    return
  }
  const contactRegistration = await store.user.registration.get(contactEmail)
  if (!contactRegistration) {
    say(buildContactNotFoundMessage(contactEmail))
    return
  }

  const existingGroupId = await store.slackLink.get(userEmail, contactEmail)
  if (existingGroupId) {
    const { channel: existingGroup } = await app.client.conversations.info({
      token: context.userToken,
      channel: existingGroupId,
    })
    say(buildGroupAlreadyExistsMessage(existingGroup.name))
    return
  }

  const chatName = generateChatName(contactEmail)
  let created = null
  let retryAttempt = 0
  while (!created && retryAttempt < 10) {
    const chatNameCandidate = generateNextCandidate(chatName, retryAttempt)
    try {
      created = await app.client.conversations.create({
        token: context.userToken,
        name: chatNameCandidate,
        is_private: true,
        user_ids: [ context.botId ]
      })
      say(buildGroupCreatedMessage(created.channel.name))
      await store.slackLink.set(userEmail, contactEmail, created.channel.id)
      await store.slackGroup.set(created.channel.id, {
        source: {
          teamId: context.teamId,
          userId: context.userId,
          email: userEmail,
        },
        sink: {
          email: contactEmail,
        },
      })
      return
    } catch (err) {
      if (err.data && err.data.error === 'name_taken') {
        retryAttempt++
      } else {
        say(buildFailedToCreateGroup(err.message))
        slackLog.error(err)
        return
      }
    }
  }
  say(buildFailedToCreateGroup('name_taken'))
  slackLog.error('Failed to create a group after 10 attempts.')
}
