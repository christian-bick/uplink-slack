import { userContacts } from '../redis-keys'
import redis from '../redis'

const sadd = (email, contactEmailList) => redis.saddAsync(userContacts(email), ...contactEmailList)
const smembers = (teamId) => redis.smembersAsync(userContacts(teamId))

export default { sadd, smembers }
