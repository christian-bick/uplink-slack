import store from '../store'
import { appLog } from '../logger'
import { SUPPORTED_MESSAGE_SUBTYPES, IGNORED_MESSAGE_SUBTYPES, buildNotSupportedMessage } from './message-types'

import { openReverseChat as slackOpenReverseChat } from '../chat-open/open-chat-reverse'
import { delegateForwarding as slackDelegateForwarding } from './delegate-forwarding'
import { APP_NAME } from '../global'
import { getMappedMessageTs } from './map-dm'

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'
export const FAILED_TO_FORWARD_THREAD_MESSAGE = `${FAILED_TO_FORWARD_MESSAGE} because the thread cannot be 
  found on your contact's side`

export const BLOCKED_MESSAGE = ':warning: You have been blocked by this contact.'
export const NOT_INSTALLED_MESSAGE = `:warning: Looks your contact is not using ${APP_NAME} anymore.`

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' }, true)

export const forwardMessage = (
  app,
  openReverseChat = slackOpenReverseChat,
  delegateForwarding = slackDelegateForwarding,
) => async ({
  context,
  message,
  say
}) => {
  try {
    // Manually complete context for message updates and deletion
    if (!context.userId) {
      const userId = message.previous_message && message.previous_message.user
      if (userId) {
        const user = await store.slack.user.get([context.teamId, userId])
        context = { ...context, ...user }
      }
    }

    forwardLog.debug({ message, context }, 'received message')

    const slackGroup = await store.slack.conversation.get([context.teamId, message.channel])
    if (!slackGroup) {
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
    if (context.accountId !== slackGroup.sourceAccountId) {
      forwardLog.debug('skipping forwarding (not a linked account)')
      return
    }

    const isBLocked = await store.account.blacklist.sismember(slackGroup.sinkAccountId, slackGroup.sourceAccountId)
    if (isBLocked) {
      say(BLOCKED_MESSAGE)
      return
    }

    const contactMedium = await store.account.medium.get(slackGroup.sinkAccountId)
    if (!contactMedium) {
      forwardLog.debug('skipping forwarding (contact medium does not exist anymore)')
      say(NOT_INSTALLED_MESSAGE)
      return
    }

    const userProfile = await store.account.profile.get(context.accountId)

    forwardLog.debug({ sinkAccountId: slackGroup.sinkAccountId }, 'assuring healthy reverse link')
    const { link: contactLink } = await openReverseChat({ app, slackGroup, contactMedium, userProfile })

    const contactTeam = await store.slack.team.get(contactMedium.teamId)

    const target = {
      username: userProfile.name,
      token: contactTeam.botToken,
      channel: contactLink.channelId,
      team: contactLink.teamId
    }

    if (message.thread_ts) {
      forwardLog.debug('attempting to find matching thread message')
      const mappedThreadTs = await getMappedMessageTs(context.teamId, message.channel, message.thread_ts)
      if (mappedThreadTs) {
        forwardLog.debug('found mapped thread message')
        target.thread_ts = mappedThreadTs
        if (message.subtype === 'thread_broadcast') {
          target.reply_broadcast = true
        }
      } else {
        forwardLog.info({ message, target, context }, 'unable not find mapped thread message')
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
