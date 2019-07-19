import store from '../store/index'
import { BotError } from '../errors'
import { appLog } from '../logger'

export const buildCannotCreateGroupInfo = (reason) => `Failed to create a group for your conversation (${reason || 'for unknown reasons'})`

export const buildFailedToFindFreeNameInfo = (attempts) => `Failed to find a free group name after ${attempts} attempts`

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

export const createLink = async ({ app, context, sourceAccountId, sinkAccountId }) => {
  const existingLink = await store.account.link.get([sourceAccountId, sinkAccountId])
  if (existingLink) {
    let existingChannelInfo
    try {
      existingChannelInfo = await app.client.conversations.info({ token: context.userToken, channel: existingLink.channelId })
    } catch (err) {
      if (err.data && err.data.error === 'channel_not_found') {
        appLog.debug({ sourceAccountId, sinkAccountId }, 'link group not found (creating new group)')
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
      appLog.debug({ sourceAccountId, sinkAccountId }, 'link already existed (using existing group)')
      return LinkResult.existing(existingLink)
    }
  }
  const sinkProfile = await store.account.profile.get(sinkAccountId)
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
      await store.slack.conversation.set([context.teamId, created.channel.id], {
        mode: 'direct-message',
        sourceAccountId,
        sinkAccountId
      })
      const link = {
        platform: 'slack',
        teamId: context.teamId,
        channelId: created.channel.id
      }
      await store.account.link.set([sourceAccountId, sinkAccountId], link)
      await store.account.contacts.sadd(sourceAccountId, [ sinkAccountId ])

      appLog.info({ sourceAccountId, sinkAccountId }, 'link created (using new group)')
      return LinkResult.created(link)
    } catch (err) {
      if (err.data && err.data.error === 'name_taken') {
        retryAttempt++
      } else {
        throw new BotError(buildCannotCreateGroupInfo(err.message), context)
      }
    }
  }
  throw new BotError(buildFailedToFindFreeNameInfo(maxAttempts), context)
}
