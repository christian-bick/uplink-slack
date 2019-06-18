import { slackTeamKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const slackTeam = {
  set: (teamId, team) => setJson(slackTeamKey(teamId), team),
  get: (teamId) => getJson(slackTeamKey(teamId))
}

export default slackTeam
