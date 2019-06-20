import { createReverseLink } from './create-link'
import store from '../store'
import { appLog } from '../logger'
import { SUPPORTED_MESSAGE_SUBTYPES, IGNORED_MESSAGE_SUBTYPES, buildNotSupportedMessage } from './message-types'
import { delegateForwarding as slackDelegateForward } from './delegate-forwarding'

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

export const forwardMessage = (app, delegateForward = slackDelegateForward) => async ({ context, message, say }) => {
  try {
    forwardLog.debug({ message }, 'received message')
    const channelId = message.channel
    const userSlackGroup = await store.slack.group.get([context.teamId, channelId])
    if (!userSlackGroup) {
      forwardLog.debug('skipping forwarding (not a linked group)')
      return
    }
    if (message.subtype && IGNORED_MESSAGE_SUBTYPES.includes(message.subtype)) {
      forwardLog.debug('skipping forwarding (ignored message subtype)')
      return
    }
    if (message.subtype && !SUPPORTED_MESSAGE_SUBTYPES[message.subtype]) {
      forwardLog.debug('skipping forwarding (not a supported message subtype)')
      say(buildNotSupportedMessage(message.subtype))
      return
    }
    if (!message.user || message.user !== userSlackGroup.source.userId) {
      forwardLog.debug('skipping forwarding (not a linked user)')
      return
    }
    let reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
    if (reverseLink) {
      forwardLog.debug({ reverseLink }, 'found reverse link')
    } else {
      forwardLog.debug('creating reverse link')
      const linkResult = await createReverseLink({ app, slackGroup: userSlackGroup })
      reverseLink = linkResult.link
    }
    const contactTeam = await store.slack.team.get(reverseLink.teamId)
    const userProfile = await store.slack.profile.get([context.teamId, context.userId])
    const target = {
      username: userProfile.name || userProfile.email,
      token: contactTeam.botToken,
      channel: reverseLink.channelId
    }
    forwardLog.debug({ message, reverseLink }, 'attempting to forward message')
    const forwardDelegate = delegateForward(message)
    if (forwardDelegate) {
      await forwardDelegate({ app, context, message, say, target })
      forwardLog.info({ message, reverseLink }, 'message forwarded')
    } else {
      forwardLog.error({ message }, 'a supported message subtype is missing implementation')
      say(FAILED_TO_FORWARD_MESSAGE)
    }
  } catch (err) {
    forwardLog.error({ err, message }, FAILED_TO_FORWARD_MESSAGE)
    say(FAILED_TO_FORWARD_MESSAGE)
  }
}
