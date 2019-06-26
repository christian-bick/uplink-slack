/* eslint-disable camelcase */
import store from '../store'

export const queryAfterTs = ({ token, channelId, ts }) => ({
  token,
  channel: channelId,
  oldest: ts,
  limit: 1
})

export const queryBeforeTs = ({ token, channelId, ts }) => ({
  token,
  channel: channelId,
  latest: ts,
  limit: 1
})

export const queryHistory = (params, isBeforeTs) => isBeforeTs ? queryBeforeTs(params) : queryAfterTs(params)

export const findMessageInHistory = async ({ app, token, channelId, botId, userId, ts }) => {
  const isBeforeTs = botId === userId
  const query = queryHistory({ token, channelId, ts }, isBeforeTs)
  const { messages } = await app.client.conversations.history(query)
  return messages.length > 0 ? messages[0] : null
}

export const findMessageInReplies = async ({ app, token, channelId, botId, userId, parent, ts }) => {
  const parentMessage = await findMessageInHistory({ app, token, channelId, botId, ts: parent.ts, userId: parent.userId })
  const isBeforeTs = botId === userId
  const query = queryHistory({ token, channelId, ts }, isBeforeTs)
  const { messages } = await app.client.conversations.replies({ ...query, ts: parentMessage.ts })
  // The first message of the array is the parent message
  return messages.length > 1 ? messages[1] : null
}

export const findMatchingMessage = async (params) => {
  const { teamId, channelId, ts, parent } = params
  const contactGroup = await store.slack.group.get([teamId, channelId])
  const { userToken: token } = await store.slack.user.get([contactGroup.source.teamId, contactGroup.source.userId])

  if (parent && parent.ts !== ts) {
    return findMessageInReplies({ ...params, token })
  } else {
    return findMessageInHistory({ ...params, token })
  }
}
