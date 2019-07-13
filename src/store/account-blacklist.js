import { accountBlacklistKey } from '../redis-keys'
import redis from '../redis'

const accountBlacklist = {
  sadd: (accountId, contactAccountList) => redis.saddAsync(accountBlacklistKey(accountId), ...contactAccountList),
  srem: (accountId, contactAccountId) => redis.srem(accountBlacklistKey(accountId), contactAccountId),
  smembers: (accountId) => redis.smembersAsync(accountBlacklistKey(accountId)),
  sismember: (accountId, contactAccountId) => redis.sismemberAsync(accountBlacklistKey(accountId), contactAccountId)
}

export default accountBlacklist
