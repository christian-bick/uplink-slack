import { findMatchingMessage } from './find-matching-message'
import store from '../store'
import { appLog } from '../logger'
import { delegateForwardForFile } from './delegate-forwarding'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-file-updated' })

export const forwardFileUpdate = (app) => async ({ event, body, context }) => {
  const fileInfo = await app.client.files.info({
    token: context.botToken,
    file: event.file_id
  })

  const groupMessageMap = fileInfo.file.shares.private

  if (!groupMessageMap) {
    forwardLog.debug('skipping file forwarding (not shared in a group)')
    return
  }

  const channelIdList = Object.keys(groupMessageMap)
  const slackGroupMultiGet = channelIdList.map(channelId => store.slack.group.get([context.teamId, channelId]))
  const slackGroupList = await Promise.all(slackGroupMultiGet)
  const userSlackGroup = slackGroupList.find(candidate => !!candidate)

  if (!userSlackGroup) {
    forwardLog.debug('skipping file forwarding (not shared in a linked group)')
    return
  }

  const link = await store.link.get([userSlackGroup.source.email, userSlackGroup.sink.email])
  const reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
  if (!reverseLink) {
    forwardLog.error({ context, source: userSlackGroup.source, sink: userSlackGroup.sink }, 'reverse link not found when forwarding a message-update')
    return
  }

  const originalMessage = groupMessageMap[link.channelId]
  originalMessage.files = [ fileInfo.file ]

  const matchingMessage = await findMatchingMessage({
    app,
    teamId: reverseLink.teamId,
    channelId: reverseLink.channelId,
    botId: context.botId,
    userId: fileInfo.file.user || context.botId,
    ts: originalMessage.ts
  })

  if (!matchingMessage) {
    forwardLog.debug('matching message not found')
    return
  }

  if (!matchingMessage.files) {
    forwardLog.error({ context, message: matchingMessage, source: userSlackGroup.source, sink: userSlackGroup.sink }, 'found a matching message without files')
    return
  }

  const contactTeam = await store.slack.team.get(userSlackGroup.source.teamId)

  const delegate = delegateForwardForFile(fileInfo.file)
  await delegate({ app,
    message: originalMessage,
    context,
    target: {
      token: contactTeam.botToken,
      channel: reverseLink.channelId,
      team: reverseLink.teamId
    } })

  await app.client.files.delete({
    token: contactTeam.botToken,
    file: matchingMessage.files[0].id
  })
}
