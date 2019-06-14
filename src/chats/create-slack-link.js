import store from '../store'

export const buildCannotCreateGroupInfo = (contactEmail, reason) => `Failed to create a group for your conversation with ${contactEmail} (${reason || 'for unknown reasons'})`

export const buildFailedToFindFreeNameInfo = (attempts) => `Failed to find a free group name after ${attempts} attempts`

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

export class LinkResult {
  static existing (group) {
    return {
      alreadyExisted: true,
      group
    }
  }
  static created (group) {
    return {
      alreadyExisted: false,
      group
    }
  }
}

export const createSlackLink = async ({ app, userEmail, contactEmail, context }) => {
  const existingGroupId = await store.slackLink.get(userEmail, contactEmail)
  if (existingGroupId) {
    const { channel: existingGroup } = await app.client.conversations.info({
      token: context.userToken,
      channel: existingGroupId
    })
    return LinkResult.existing(existingGroup)
  }

  const chatName = generateChatName(contactEmail)
  let created = null
  let retryAttempt = 0
  const maxAttempts = 10
  while (!created && retryAttempt < maxAttempts) {
    const chatNameCandidate = generateNextCandidate(chatName, retryAttempt)
    try {
      created = await app.client.conversations.create({
        token: context.userToken,
        name: chatNameCandidate,
        is_private: true
      })
      await app.client.conversations.invite({
        token: context.userToken,
        channel: created.channel.id,
        users: context.botId
      })
      await store.slackLink.set(userEmail, contactEmail, created.channel.id)
      await store.slackGroup.set(created.channel.id, {
        source: {
          teamId: context.teamId,
          userId: context.userId,
          email: userEmail
        },
        sink: {
          email: contactEmail
        }
      })
      return LinkResult.created(created.channel)
    } catch (err) {
      if (err.data && err.data.error === 'name_taken') {
        retryAttempt++
      } else {
        throw new Error(buildCannotCreateGroupInfo(contactEmail, err.message))
      }
    }
  }
  throw new Error(buildFailedToFindFreeNameInfo(maxAttempts))
}

