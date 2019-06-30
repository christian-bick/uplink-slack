import { userContactsKey } from '../redis-keys'
import redis from '../redis'

const userContacts = {
  sadd: (email, contactEmailList) => redis.saddAsync(userContactsKey(email), ...contactEmailList),
  srem: (email, contactEmail) => redis.srem(userContactsKey(email), contactEmail),
  smembers: (email) => redis.smembersAsync(userContactsKey(email))
}

export default userContacts
