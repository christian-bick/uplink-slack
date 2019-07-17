import store from '../store'

export const slackFileId = (teamId, fileId) => `slack-${teamId}-${fileId}`
export const slackMessageId = (teamId, channelId, ts) => `slack-${teamId}-${channelId}-${ts}`

export const mapMessage = (original, forwarded) => {
  return Promise.all([
    store.mapping.dm.set(slackMessageId(original.team, original.channel, original.ts), forwarded.ts),
    store.mapping.dm.set(slackMessageId(forwarded.team, forwarded.channel, forwarded.ts), original.ts)
  ])
}

export const mapFile = (original, forwarded) => {
  return Promise.all([
    store.mapping.dm.set(slackFileId(original.team, original.id), forwarded.id),
    store.mapping.dm.set(slackFileId(forwarded.team, forwarded.id), original.id)
  ])
}

export const getMappedMessageTs = (teamId, channelId, ts) => {
  return getMappedId(slackMessageId(teamId, channelId, ts))
}

export const getMappedFileId = (teamId, fileId) => {
  return getMappedId(slackFileId(teamId, fileId))
}

export const getMappedId = (mappingId) => {
  return store.mapping.dm.get(mappingId)
}

export const removeMessageMapping = (message, mappedMessage) => {
  return Promise.all([
    store.mapping.dm.del(slackMessageId(message.team, message.channel, message.ts)),
    store.mapping.dm.del(slackMessageId(mappedMessage.team, mappedMessage.channel, mappedMessage.ts))
  ])
}
