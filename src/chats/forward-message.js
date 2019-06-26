import store from '../store'
import { appLog } from '../logger'
import { SUPPORTED_MESSAGE_SUBTYPES, IGNORED_MESSAGE_SUBTYPES, buildNotSupportedMessage } from './message-types'

import { createReverseLink as slackCreateReverseLink } from './create-link'
import { delegateForwarding as slackDelegateForwarding } from './delegate-forwarding'
import { findMatchingMessage as slackFindMatchingMessage } from './find-matching-message'

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'
export const FAILED_TO_FORWARD_THREAD_MESSAGE = `${FAILED_TO_FORWARD_MESSAGE} because the threat cannot be 
  found on your contact's side`

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' }, true)

export const forwardMessage = (
  app,
  createReverseLink = slackCreateReverseLink,
  delegateForwarding = slackDelegateForwarding,
  findMatchingMessage = slackFindMatchingMessage
) => async ({
  context,
  message,
  say
}) => {
  try {
    // Complete context for message updates and deletion
    context.userId = context.userId || (message.previous_message && message.previous_message.user)

    forwardLog.debug({ message, context }, 'received message')

    const userSlackGroup = await store.slack.group.get([context.teamId, message.channel])
    if (!userSlackGroup) {
      forwardLog.debug('skipping forwarding (not a linked group)')
      return
    }
    if (message.subtype && IGNORED_MESSAGE_SUBTYPES[message.subtype]) {
      forwardLog.debug('skipping forwarding (ignored message subtype)')
      return
    }
    if (message.subtype && !SUPPORTED_MESSAGE_SUBTYPES[message.subtype]) {
      forwardLog.debug('skipping forwarding (not a supported message subtype)')
      say(buildNotSupportedMessage(message.subtype))
      return
    }
    if (context.userId !== userSlackGroup.source.userId) {
      forwardLog.debug('skipping forwarding (not a linked user)')
      return
    }
    let reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
    if (reverseLink) {
      forwardLog.debug({ reverseLink }, 'found reverse link')
    } else {
      forwardLog.debug('attempting to create reverse link')
      const linkResult = await createReverseLink({ app, slackGroup: userSlackGroup })
      reverseLink = linkResult.link
      forwardLog.debug({ reverseLink }, 'reverse link created')
    }
    const contactTeam = await store.slack.team.get(reverseLink.teamId)
    const userProfile = await store.slack.profile.get([context.teamId, context.userId])

    const target = {
      username: userProfile.name || userProfile.email,
      token: contactTeam.botToken,
      channel: reverseLink.channelId,
      team: reverseLink.teamId
    }

    if (message.thread_ts) {
      forwardLog.debug('attempting to find matching thread message')

      const matchingMessage = await findMatchingMessage({
        app,
        channelId: reverseLink.channelId,
        teamId: reverseLink.teamId,
        userId: message.parent_user_id,
        botId: context.botId,
        ts: message.thread_ts,
      })

      if (matchingMessage) {
        forwardLog.debug('found matching thread message')
        target.thread_ts = matchingMessage.ts
        if (message.subtype === 'thread_broadcast') {
          target.reply_broadcast = true
        }
      } else {
        forwardLog.info({ message, target, context }, 'unable not find matching thread message')
        say(FAILED_TO_FORWARD_THREAD_MESSAGE)
      }
    }
    if (userProfile.image48) {
      target.icon_url = userProfile.image48
    }
    forwardLog.debug({ message, target }, 'attempting to forward message')
    const forwardDelegate = delegateForwarding(message)
    if (forwardDelegate) {
      await forwardDelegate({ app, context, message, say, target })
      forwardLog.info({ context, message, reverseLink }, 'message forwarded')
    } else {
      forwardLog.error({ message }, 'a supported message subtype is missing implementation')
      say(FAILED_TO_FORWARD_MESSAGE)
    }
  } catch (err) {
    forwardLog.error({ err, message }, FAILED_TO_FORWARD_MESSAGE)
    say(FAILED_TO_FORWARD_MESSAGE)
  }
}
