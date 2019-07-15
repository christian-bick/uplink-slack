import { createLink } from './create-link'
import { buildGroupCreatedMessage } from './open-chat'
import store from '../store'

export const openReverseChat = async ({ app, userProfile, slackGroup, contactMedium }) => {
  const contactSlackTeam = await store.slack.team.get(contactMedium.teamId)
  const contactSlackUser = await store.slack.user.get([contactMedium.teamId, contactMedium.userId])
  const context = {...contactSlackTeam, ...contactSlackUser}
  const linkResult = await createLink({
    app,
    context,
    sourceAccountId: slackGroup.sinkAccountId,
    sinkAccountId: slackGroup.sourceAccountId
  })
  if (!linkResult.alreadyExisted) {
    await app.client.chat.postMessage({
      token: context.botToken,
      channel: linkResult.link.channelId,
      ...buildGroupCreatedMessage({
        userId: contactMedium.userId,
        contactName: userProfile.name,
        contactAccountId: slackGroup.sourceAccountId
      }, true)
    })
  }
  return linkResult
}
