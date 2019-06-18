import store from '../store'

export default async ({ teamId, userId }) => {
  const { botId, botToken } = await store.slack.team.get(teamId)
  const context = { teamId, botId, botToken }
  if (userId) {
    const user = await store.slack.user.get([teamId, userId])
    if (user) {
      context.userToken = user.userToken
    }
    context.userId = userId
  }
  return context
}
