import redis from '../redis'
import { activeTeamOfUser } from '../redis-keys'

export default (app) => {
  app.action('open-chat', async ({ action, context, ack, say }) => {
    ack()
    const teamId = redis.getAsync(activeTeamOfUser(action.value))
    if (!teamId) {
      say('No user with this email address')
    } else {
      await app.client.groups.create({
        token: context.userToken,
        name: action.value
      })
    }
  })
}
