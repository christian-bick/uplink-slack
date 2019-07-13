import { accountContactsKey } from '../redis-keys'
import redis from '../redis'

const accountContacts = {
  sadd: (accountId, contactAccountList) => redis.saddAsync(accountContactsKey(accountId), ...contactAccountList),
  srem: (accountId, contactAccountId) => redis.srem(accountContactsKey(accountId), contactAccountId),
  smembers: (accountId) => redis.smembersAsync(accountContactsKey(accountId))
}

export default accountContacts
