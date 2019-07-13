import store from '../store'
import { appLog } from '../logger'
import { SUPPORTED_MESSAGE_SUBTYPES, IGNORED_MESSAGE_SUBTYPES, buildNotSupportedMessage } from './message-types'

import { openReverseChat as slackOpenReverseChat } from '../chat-open/open-chat-reverse'
import { delegateForwarding as slackDelegateForwarding } from './delegate-forwarding'
import { findMatchingMessage as slackFindMatchingMessage } from './find-matching-message'

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'
export const FAILED_TO_FORWARD_THREAD_MESSAGE = `${FAILED_TO_FORWARD_MESSAGE} because the threat cannot be 
  found on your contact's side`

export const BLOCKED_MESSAGE = ':warning: You have been blocked by this user.'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' }, true)

export const forwardMessage = (
  app,
  openReverseChat = slackOpenReverseChat,
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

    const userSlackGroup = await store.slack.conversation.get([context.teamId, message.channel])
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
    if (context.accountId !== userSlackGroup.sourceAccountId) {
      forwardLog.debug('skipping forwarding (not a linked account)')
      return
    }

    const isBLocked = await store.account.blacklist.sismember(userSlackGroup.sinkAccountId, userSlackGroup.sourceAccountId)
    if (isBLocked) {
      say(BLOCKED_MESSAGE)
      return
    }

    forwardLog.debug({ sinkAccountId: userSlackGroup.sinkAccountId }, 'assuring healthy reverse link')
    const { link: contactLink } = await openReverseChat({ app, slackGroup: userSlackGroup })

    const userProfile = await store.account.profile.get(context.accountId)
    const contactTeam = await store.slack.team.get(contactLink.teamId)

    const target = {
      username: userProfile.name,
      token: contactTeam.botToken,
      channel: contactLink.channelId,
      team: contactLink.teamId
    }

    if (message.thread_ts) {
      forwardLog.debug('attempting to find matching thread message')

      const matchingMessage = await findMatchingMessage({
        app,
        channelId: contactLink.channelId,
        teamId: contactLink.teamId,
        userId: message.parent_user_id,
        botId: context.botId,
        ts: message.thread_ts
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
    if (userProfile.avatar) {
      target.icon_url = userProfile.avatar
    }
    forwardLog.debug({ message, target }, 'attempting to forward message')
    const forwardDelegate = delegateForwarding(message)
    if (forwardDelegate) {
      await forwardDelegate({ app, context, message, say, target })
      forwardLog.info({ context, message, reverseLink: contactLink }, 'message forwarded')
    } else {
      forwardLog.error({ message }, 'a supported message subtype is missing implementation')
      say(FAILED_TO_FORWARD_MESSAGE)
    }
  } catch (err) {
    forwardLog.error({ err, message }, FAILED_TO_FORWARD_MESSAGE)
    say(FAILED_TO_FORWARD_MESSAGE)
  }
}
