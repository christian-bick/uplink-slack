import { accountContactsKey } from '../redis-keys'
import redis from '../redis'

const accountContacts = {
  sadd: (email, contactEmailList) => redis.saddAsync(accountContactsKey(email), ...contactEmailList),
  srem: (email, contactEmail) => redis.srem(accountContactsKey(email), contactEmail),
  smembers: (email) => redis.smembersAsync(accountContactsKey(email))
}

export default accountContacts
