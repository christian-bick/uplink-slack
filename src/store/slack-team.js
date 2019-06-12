import { slackTeam } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (teamId, team) => setJson(slackTeam(teamId), team)
const get = (teamId) => getJson(slackTeam(teamId))

export default { set, get }
