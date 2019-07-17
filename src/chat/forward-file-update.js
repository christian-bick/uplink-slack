import store from '../store'
import { appLog } from '../logger'
import { delegateForwardForFile } from './delegate-forwarding'
import {getMappedFileId, mapMessage} from './map-dm'

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
  const slackGroupMultiGet = channelIdList.map(channelId => store.slack.conversation.get([context.teamId, channelId]))
  const slackGroupList = await Promise.all(slackGroupMultiGet)
  const userSlackGroup = slackGroupList.find(candidate => !!candidate)

  if (!userSlackGroup) {
    forwardLog.debug('skipping file forwarding (not shared in a linked group)')
    return
  }

  const link = await store.account.link.get([userSlackGroup.sourceAccountId, userSlackGroup.sinkAccountId])
  const reverseLink = await store.account.link.get([userSlackGroup.sinkAccountId, userSlackGroup.sourceAccountId])
  if (!reverseLink) {
    forwardLog.error({ context, source: userSlackGroup.source, sink: userSlackGroup.sink }, 'reverse link not found when forwarding a message-update')
    return
  }

  const fileMessage = groupMessageMap[link.channelId]
  fileMessage.files = [ fileInfo.file ]

  const mappedFileId = await getMappedFileId(context.teamId, event.file_id)

  if (!mappedFileId) {
    forwardLog.debug('mapped file not found')
    return
  }

  const contactTeam = await store.slack.team.get(reverseLink.teamId)

  const delegate = delegateForwardForFile(fileInfo.file)
  await delegate({ app,
    message: fileMessage,
    context,
    target: {
      token: contactTeam.botToken,
      channel: reverseLink.channelId,
      team: reverseLink.teamId
    } })

  await app.client.files.delete({
    token: contactTeam.botToken,
    file: mappedFileId
  })
}
