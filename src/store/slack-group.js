import { slackGroup } from '../redis-keys'
import redis from '../redis'

const set = (userEmail, contactEmail, groupId) => redis.setAsync(slackGroup(userEmail, contactEmail), groupId)
const get = (userEmail, contactEmail) => redis.getAsync(slackGroup(userEmail, contactEmail))

export default {
  set, get
}