import { usageInvitesKey } from '../redis-keys'
import redis from '../redis'

const usageInvites = {
  incr: async (accountId, ttl) => {
    const result = await redis.multi()
      .incr(usageInvitesKey(accountId))
      .expire(usageInvitesKey(accountId), ttl)
      .execAsync()
    return result[0]
  }
}

export default usageInvites
