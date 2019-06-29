import { findMatchingMessage } from './find-matching-message'
import store from '../store'
import { appLog } from '../logger'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

export const forwardReaction = (app, remove = false) => async ({ event, body, context }) => {
  const userSlackGroup = await store.slack.group.get([context.teamId, event.item.channel])
  if (!userSlackGroup) {
    forwardLog.debug('skipping reaction forwarding (not a linked group)')
    return
  }

  if (context.userId !== userSlackGroup.source.userId) {
    forwardLog.debug('skipping reaction forwarding (not a linked user)')
    return
  }

  const { messages } = await app.client.conversations.history({
    token: context.userToken,
    latest: event.item.ts,
    oldest: event.item.ts,
    channel: event.item.channel,
    inclusive: true,
    limit: 1
  })
  const message = messages[0]

  if (!message) {
    forwardLog.debug('skipping reaction forwarding (not supported for threads)')
    return
  }

  const reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
  if (!reverseLink) {
    forwardLog.error({ context, message: event.item, source: userSlackGroup.source, sink: userSlackGroup.sink }, 'reverse link not found when forwarding a reaction')
    return
  }

  const matchingMessage = await findMatchingMessage({
    app,
    teamId: reverseLink.teamId,
    channelId: reverseLink.channelId,
    botId: context.botId,
    userId: event.item_user || context.botId,
    ts: message.ts
  })

  if (!matchingMessage) {
    forwardLog.debug('matching message not found')
    return
  }

  const contactTeam = await store.slack.team.get(userSlackGroup.source.teamId)

  const req = {
    token: contactTeam.botToken,
    channel: reverseLink.channelId,
    timestamp: matchingMessage.ts,
    name: event.reaction
  }

  if (remove) {
    await app.client.reactions.remove(req)
    forwardLog.info({ context, message }, 'reaction removed')
  } else {
    await app.client.reactions.add(req)
    forwardLog.info({ context, message }, 'reaction added')
  }
}
