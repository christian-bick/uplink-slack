import { userContactsKey } from '../redis-keys'
import redis from '../redis'

const userContacts = {
  sadd: (email, contactEmailList) => redis.saddAsync(userContactsKey(email), ...contactEmailList),
  smembers: (email) => redis.smembersAsync(userContactsKey(email))
}

export default userContacts
