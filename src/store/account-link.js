import { accountLinksKey } from '../redis-keys'
import { hgetJson, hsetJson } from '../redis-ops'

const accountLink = {
  set: ([sourceAccountId, sinkAccountId], link) => hsetJson(accountLinksKey(sourceAccountId), sinkAccountId, link),
  get: ([sourceAccountId, sinkAccountId]) => hgetJson(accountLinksKey(sourceAccountId), sinkAccountId)
}

export default accountLink
