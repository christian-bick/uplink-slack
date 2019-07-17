import store from '../store'
import { appLog } from '../logger'
import { getMappedMessageTs } from './map-dm'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

export const forwardReaction = (app, remove = false) => async ({ event, body, context }) => {
  const userSlackGroup = await store.slack.conversation.get([context.teamId, event.item.channel])
  if (!userSlackGroup) {
    forwardLog.debug('skipping reaction forwarding (not a linked group)')
    return
  }

  if (context.accountId !== userSlackGroup.sourceAccountId) {
    forwardLog.debug('skipping reaction forwarding (not a linked user)')
    return
  }

  const reverseLink = await store.account.link.get([userSlackGroup.sinkAccountId, userSlackGroup.sourceAccountId])
  if (!reverseLink) {
    forwardLog.error({ context, message: event.item, group: userSlackGroup }, 'reverse link not found when forwarding a reaction')
    return
  }

  const mappedMessageTs = await getMappedMessageTs(context.teamId, event.item.channel, event.item.ts)

  if (!mappedMessageTs) {
    forwardLog.debug('mapped message not found')
    return
  }

  const contactTeam = await store.slack.team.get(reverseLink.teamId)

  const req = {
    token: contactTeam.botToken,
    channel: reverseLink.channelId,
    timestamp: mappedMessageTs,
    name: event.reaction
  }

  if (remove) {
    await app.client.reactions.remove(req)
    forwardLog.info({ context }, 'reaction removed')
  } else {
    await app.client.reactions.add(req)
    forwardLog.info({ context }, 'reaction added')
  }
}
