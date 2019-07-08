import { accountAddressKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const accountAddress = {
  set: (accountId, addresses) => setJson(accountAddressKey(accountId), addresses),
  get: (accountId) => getJson(accountAddressKey(accountId))
}

export default accountAddress
