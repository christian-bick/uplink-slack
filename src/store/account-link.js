import { accountLinkKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const accountLink = {
  set: ([sourceAccountId, sinkAccountId], link) => setJson(accountLinkKey(sourceAccountId, sinkAccountId), link),
  get: ([sourceAccountId, sinkAccountId]) => getJson(accountLinkKey(sourceAccountId, sinkAccountId))
}

export default accountLink
