import { slackLink } from '../redis-keys'
import redis from '../redis'

const set = (sourceEmail, sinkEmail, groupId) => redis.setAsync(slackLink(sourceEmail, sinkEmail), groupId)
const get = (sourceEmail, sinkEmail) => redis.getAsync(slackLink(sourceEmail, sinkEmail))

export default {
  set, get
}