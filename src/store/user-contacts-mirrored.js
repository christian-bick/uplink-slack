import { userContactsMirroredKey } from '../redis-keys'
import redis from '../redis'

const userContactsMirrored = {
  sadd: (email, contactEmailList) => redis.saddAsync(userContactsMirroredKey(email), ...contactEmailList),
  srem: (email, contactEmail) => redis.srem(userContactsMirroredKey(email), contactEmail),
  smembers: (email) => redis.smembersAsync(userContactsMirroredKey(email))
}

export default userContactsMirrored
