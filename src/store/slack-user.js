import { slackUser } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (userId, user) => setJson(slackUser(userId), user)
const get = (userId) => getJson(slackUser(userId))

export default { set, get }
