/* eslint-disable camelcase */
import store from '../store'

export const findMessageInHistory = async ({ app, token, channel, ts }) => {
  const { messages } = await app.client.conversations.history({
    token,
    channel,
    oldest: ts,
    limit: 1
  })
  return messages.length > 0 ? messages[0] : null
}

export const findMessageInReplies = async ({ app, token, channel, ts, thread_ts }) => {
  const parentMessage = await findMessageInHistory({ app, token, channel, ts: thread_ts })
  const { messages } = await app.client.conversations.replies({
    token,
    channel,
    ts: parentMessage.ts,
    oldest: ts,
    limit: 1
  })
  // The first message in the array is always the parent message
  return messages.length > 1 ? messages[1] : null
}

export const findMatchingMessage = async ({ app, teamId, channelId, ts, thread_ts }) => {
  const contactGroup = await store.slack.group.get([teamId, channelId])
  const contactUser = await store.slack.user.get([contactGroup.source.teamId, contactGroup.source.userId])

  if (thread_ts && ts !== thread_ts) {
    return findMessageInReplies({ app, token: contactUser.userToken, channel: channelId, ts, thread_ts })
  } else {
    return findMessageInHistory({ app, token: contactUser.userToken, channel: channelId, ts })
  }
}
