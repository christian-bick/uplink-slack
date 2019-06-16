import { slackProfile } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (userId, profile) => setJson(slackProfile(userId), profile)
const get = (userId) => getJson(slackProfile(userId))

export default { set, get }
