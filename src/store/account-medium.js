import { accountMediumKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'
import redis from '../redis'

const accountMedium = {
  set: (accountId, profile) => setJson(accountMediumKey(accountId), profile),
  get: (accountId) => getJson(accountMediumKey(accountId)),
  del: (accountId) => redis.del(accountMediumKey(accountId))
}

export default accountMedium
