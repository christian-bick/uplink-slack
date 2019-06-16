import { userContacts } from '../redis-keys'
import redis from '../redis'

const sadd = (email, contactEmailList) => redis.saddAsync(userContacts(email), ...contactEmailList)
const smembers = (email) => redis.smembersAsync(userContacts(email))

export default { sadd, smembers }
