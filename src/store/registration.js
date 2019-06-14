import { userRegistration } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (email, registration) => setJson(userRegistration(email), registration)
const get = (email) => getJson(userRegistration(email))

export default { set, get }
