import store from '../store'

export default async ({ teamId, userId }) => {
  const { botUserId: botId, botToken } = await store.slackTeam.get(teamId)
  const context = { teamId, botId, botToken }
  if (userId) {
    const { userToken } = await store.slackUser.get(userId)
    context.userId = userId
    context.userToken = userToken
  }
  return context
}
