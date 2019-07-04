import { userInvitesKey } from '../redis-keys'
import redis from '../redis'

const userInvites = {
  setex: (email, ttl, invitee) => redis.setexAsync(userInvitesKey(email), ttl, invitee),
  get: (email) => redis.getAsync(userInvitesKey(email)),
}

export default userInvites
