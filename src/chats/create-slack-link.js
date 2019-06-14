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

export const createSlackLink = async ({ app, context, source, sink }) => {
  const existingLink = await store.slackLink.get(source.email, sink.email)
  if (existingLink) {
    const { channel: existingGroup } = await app.client.conversations.info({
      token: context.userToken,
      channel: existingLink.channelId
    })
    return LinkResult.existing(existingGroup)
  }
  const chatName = generateChatName(sink.email)
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
      await store.slackLink.set(source.email, sink.email, {
        platform: 'slack',
        type: 'group',
        channelId: created.channel.id
      })
      await store.slackGroup.set(created.channel.id, {
        source: {
          userId: source.userId,
          teamId: source.teamId,
          email: source.email
        },
        sink: {
          email: sink.email
        }
      })
      return LinkResult.created(created.channel)
    } catch (err) {
      if (err.data && err.data.error === 'name_taken') {
        retryAttempt++
      } else {
        throw new Error(buildCannotCreateGroupInfo(sink.email, err.message))
      }
    }
  }
  throw new Error(buildFailedToFindFreeNameInfo(maxAttempts))
}

export const createReverseSlackLink = async ({ app, sourceSlackGroup }) => {
  const contactRegistration = await store.user.registration.get(sourceSlackGroup.sink.email)
  if (!contactRegistration) {
    throw Error(`No registration found for contact ${sourceSlackGroup.sink.email}`)
  }
  const contactSlackTeam = await store.slackTeam.get(contactRegistration.teamId)
  const contactSlackUser = await store.slackUser.get(contactRegistration.userId)
  const context = { ...contactSlackTeam, ...contactSlackUser }
  return createSlackLink({
    app,
    context,
    source: contactRegistration,
    sink: sourceSlackGroup.source
  })
}
