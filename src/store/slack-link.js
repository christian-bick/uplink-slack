import { slackLink } from '../redis-keys'
import redis from '../redis'

const set = (userEmail, contactEmail, groupId) => redis.setAsync(slackLink(userEmail, contactEmail), groupId)
const get = (userEmail, contactEmail) => redis.getAsync(slackLink(userEmail, contactEmail))

export default {
  set, get
}