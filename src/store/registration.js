import { userRegistration } from '../redis-keys'
import { getJson, setnxJson } from '../redis-ops'

const setnx = (email, registration) => setnxJson(userRegistration(email), registration)
const get = (email) => getJson(userRegistration(email))

export default { setnx, get }
