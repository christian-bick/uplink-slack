import { createReverseSlackLink } from './create-slack-link'
import store from '../store'
import { appLog } from '../logger'

const forwardLog = appLog.child({ action: 'forwarding' })

export const forwardMessage = (app) => async ({ context, message }) => {
  forwardLog.debug('Received message', { user: message.user || message.bot_id, channel: message.channel })
  const channelId = message.channel
  const userSlackGroup = await store.slackGroup.get(channelId)
  if (!userSlackGroup) {
    forwardLog.debug('Skipping forwarding (not a linked group)')
    return
  }
  if (!message.user || message.user !== userSlackGroup.source.userId) {
    forwardLog.debug('Skipping forwarding (not a linked user)')
    return
  }
  const reverseLink = await store.link.get(userSlackGroup.sink.email, userSlackGroup.source.email)
  let contactSlackGroup
  if (reverseLink) {
    forwardLog.debug('Found reverse link', reverseLink)
    contactSlackGroup = await store.slackGroup.get(reverseLink.channelId)
  } else {
    forwardLog.debug('Creating reverse link', reverseLink)
    const { group } = await createReverseSlackLink({ app, sourceSlackGroup: userSlackGroup })
    contactSlackGroup = group
  }
  const contactTeam = await store.slackTeam.get(contactSlackGroup.source.teamId)
  forwardLog.debug('Forwarding message', { channelId: reverseLink.channelId })
  const userProfile = await store.slackProfile.get(context.userId)
  console.log(userProfile)
  await app.client.chat.postMessage({
    username: userProfile.name || userProfile.email,
    token: contactTeam.botToken,
    channel: reverseLink.channelId,
    text: message.text
  })
}
