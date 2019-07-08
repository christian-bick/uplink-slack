import { invitesKey } from '../redis-keys'
import redis from '../redis'

const invites = {
  setex: (email, ttl, invitee) => redis.setexAsync(invitesKey(email), ttl, invitee),
  get: (email) => redis.getAsync(invitesKey(email)),
}

export default invites
