import store from '../store'

export const buildJoinUserInfo = (joinedUserId, userProfile, contactProfile) => (
  `Hi <@${joinedUserId}>! This group is linked to an external conversation with ${contactProfile.name}. ` +
  `You can follow their conversation here but I will only forward messages of ${userProfile.name}.`
)

export const rejoinLinkedGroup = (app) => async ({ event, context }) => {
  const channelId = event.channel
  const slackGroup = await store.slack.group.get([context.teamId, channelId])
  if (!slackGroup) {
    return
  }
  const slackUser = await store.slack.user.get([slackGroup.source.teamId, slackGroup.source.userId])
  app.client.conversations.invite({
    token: slackUser.userToken,
    channel: channelId,
    users: context.botId
  })
}

export const informJoinedUser = (app) => async ({ event, context }) => {
  const channelId = event.channel
  const slackGroup = await store.slack.group.get([context.teamId, channelId])
  if (!slackGroup || event.user === slackGroup.source.userId || event.user === context.botId) {
    return
  }
  const userProfile = await store.slack.profile.get([slackGroup.source.teamId, slackGroup.source.userId])
  const contactRegistration = await store.user.registration.get(slackGroup.sink.email)
  const contactProfile = await store.slack.profile.get([contactRegistration.teamId, contactRegistration.userId])
  app.client.chat.postMessage({
    token: context.botToken,
    channel: channelId,
    text: buildJoinUserInfo(event.user, userProfile, contactProfile)
  })
}
