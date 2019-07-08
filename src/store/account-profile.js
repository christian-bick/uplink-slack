import { accountProfileKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const accountProfile = {
  set: (accountId, profile) => setJson(accountProfileKey(accountId), profile),
  get: (accountId) => getJson(accountProfileKey(accountId))
}

export default accountProfile
