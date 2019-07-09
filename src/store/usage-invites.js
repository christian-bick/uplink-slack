import { usageInvitesKey } from '../redis-keys'
import { incrAndExpire } from '../redis-ops'

const usageInvites = {
  incr: async (accountId, ttl) => incrAndExpire(usageInvitesKey(accountId), ttl)
}

export default usageInvites
