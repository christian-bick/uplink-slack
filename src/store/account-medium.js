import { accountMediumKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'
import redis from '../redis'

const accountMedium = {
  set: (accountId, medium) => setJson(accountMediumKey(accountId), medium),
  get: (accountId) => getJson(accountMediumKey(accountId)),
  del: (accountId) => redis.del(accountMediumKey(accountId))
}

export default accountMedium
