import store from '../store'

export const buildInvitingUserInfo = (invitingUserId) => (
  `<@${invitingUserId}> This group is a direct message conversation. For group conversations, use Slack's built in shared channels.`
)

export const rejoinLinkedGroup = (app) => async ({ event, context }) => {
  const channelId = event.channel
  const slackGroup = await store.slack.conversation.get([context.teamId, channelId])
  if (!slackGroup) {
    return
  }
  const medium = await store.account.medium.get(slackGroup.sourceAccountId)
  const slackUser = await store.slack.user.get([medium.teamId, medium.userId])
  app.client.conversations.invite({
    token: slackUser.userToken,
    channel: channelId,
    users: context.botId
  })
}

export const removeJoinedUser = (app) => async ({ event, context }) => {
  const slackGroup = await store.slack.conversation.get([context.teamId, event.channel])
  if (!slackGroup || context.accountId === slackGroup.sourceAccountId || event.user === context.botId) {
    return
  }
  const invitingUser = await store.slack.user.get([context.teamId, event.inviter])
  await app.client.conversations.kick({
    token: invitingUser.userToken,
    channel: event.channel,
    user: event.user
  })
  await app.client.chat.postMessage({
    token: context.botToken,
    channel: event.channel,
    text: buildInvitingUserInfo(event.inviter)
  })
}
