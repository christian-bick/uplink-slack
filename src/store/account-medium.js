import { accountMediumKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const accountMedium = {
  set: (accountId, profile) => setJson(accountMediumKey(accountId), profile),
  get: (accountId) => getJson(accountMediumKey(accountId))
}

export default accountMedium
