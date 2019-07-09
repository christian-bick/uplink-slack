import { usageChatsKey } from '../redis-keys'
import { incrAndExpire } from '../redis-ops'

const usageChats = {
  incr: async (accountId, ttl) => incrAndExpire(usageChatsKey(accountId), ttl)
}

export default usageChats
