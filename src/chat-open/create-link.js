import store from '../store/index'
import { BotError } from '../errors'
import { appLog } from '../logger'

export const buildCannotCreateGroupInfo = (contactEmail, reason) => `Failed to create a group for your conversation with ${contactEmail} (${reason || 'for unknown reasons'})`

export const buildFailedToFindFreeNameInfo = (attempts) => `Failed to find a free group name after ${attempts} attempts`

export const buildReverseGroupCreatedMessage = (userId, contactName) =>
  `<@${userId}> This is the start of your conversation with ${contactName}. I will forward messages between the two of you within this group.\n\n
  _Please note that your contact will be able to see your profile name and profile picture for this workspace._`

export const generateChannelName = (name) => {
  const hyphened = name.split(' ').join('-').toLowerCase()
  return `dm-${hyphened.substr(0, 18)}`
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
  static existing (link) {
    return {
      alreadyExisted: true,
      link
    }
  }
  static created (link) {
    return {
      alreadyExisted: false,
      link
    }
  }
}

export const createLink = async ({ app, context, source, sink }) => {
  const existingLink = await store.link.get([source.email, sink.email])
  if (existingLink) {
    let existingChannelInfo
    try {
      existingChannelInfo = await app.client.conversations.info({ token: context.userToken, channel: existingLink.channelId })
    } catch (err) {
      if (err.data && err.data.error === 'channel_not_found') {
        appLog.info({ context, source, sink }, 'link group not found (creating new group)')
      } else {
        throw err
      }
    }

    if (existingChannelInfo) {
      if (existingChannelInfo.channel.is_archived) {
        await app.client.conversations.unarchive({
          token: context.userToken,
          channel: existingLink.channelId
        })
      }
      appLog.info({ context, source, sink }, 'link created (from existing group)')
      return LinkResult.existing(existingLink)
    }
  }
  const sinkProfile = await store.slack.profile.get([sink.teamId, sink.userId])
  const chatName = generateChannelName(sinkProfile.name)
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
      await store.slack.group.set([source.teamId, created.channel.id], {
        mode: 'direct-message',
        source: {
          userId: source.userId,
          teamId: source.teamId,
          email: source.email
        },
        sink: {
          email: sink.email
        }
      })
      const link = {
        platform: 'slack',
        type: 'group',
        teamId: source.teamId,
        channelId: created.channel.id
      }
      await store.link.set([source.email, sink.email], link)

      appLog.info({ context, source, sink }, 'link created (from new group)')
      return LinkResult.created(link)
    } catch (err) {
      if (err.data && err.data.error === 'name_taken') {
        retryAttempt++
      } else {
        throw new BotError(buildCannotCreateGroupInfo(sink.email, err.message), context)
      }
    }
  }
  throw new BotError(buildFailedToFindFreeNameInfo(maxAttempts), context)
}

export const createReverseLink = async ({ app, slackGroup }) => {
  const contactRegistration = await store.user.registration.get(slackGroup.sink.email)
  const userRegistration = await store.user.registration.get(slackGroup.source.email)
  const userProfile = await store.slack.profile.get([slackGroup.source.teamId, slackGroup.source.userId])
  const contactSlackTeam = await store.slack.team.get(contactRegistration.teamId)
  const contactSlackUser = await store.slack.user.get([contactRegistration.teamId, contactRegistration.userId])
  const context = { ...contactSlackTeam, ...contactSlackUser }
  const linkResult = await createLink({
    app,
    context,
    source: contactRegistration,
    sink: userRegistration
  })
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: linkResult.link.channelId,
    text: buildReverseGroupCreatedMessage(contactRegistration.userId, userProfile.name)
  })
  return linkResult
}
