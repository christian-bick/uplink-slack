import store from '../store'

export default async ({ teamId, userId }) => {
  const { botId, botToken } = await store.slackTeam.get(teamId)
  const context = { teamId, botId, botToken }
  if (userId) {
    const user = await store.slackUser.get(userId)
    if (user) {
      context.userToken = user.userToken
    }
    context.userId = userId
  }
  return context
}
