import { createReverseSlackLink } from './create-slack-link'
import store from '../store'

export const forwardMessage = (app) => async ({ context, message }) => {
  const channelId = message.channel
  const userSlackGroup = await store.slackGroup.get(channelId)
  if (!userSlackGroup) {
    console.log('No slack group found')
    return
  }
  if (!message.user || message.user !== userSlackGroup.source.userId) {
    console.log('Not the source user')
    return
  }
  const reverseLink = await store.slackLink.get(userSlackGroup.sink.email, userSlackGroup.source.email)
  let contactSlackGroup
  if (reverseLink) {
    contactSlackGroup = await store.slackGroup.get(reverseLink.channelId)
  } else {
    const { group } = await createReverseSlackLink({ app, sourceSlackGroup: userSlackGroup })
    contactSlackGroup = group
  }
  const contactTeam = await store.slackTeam.get(contactSlackGroup.source.teamId)
  await app.client.chat.postMessage({
    token: contactTeam.botToken,
    channel: reverseLink.channelId,
    text: message.text,
  })
}
