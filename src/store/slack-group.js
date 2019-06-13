import { slackGroup } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (groupId, group) => setJson(slackGroup(groupId), group)
const get = (groupId) => getJson(slackGroup(groupId))

export default { set, get }
