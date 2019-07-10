import { slackTeamKey } from '../redis-keys'
import { setEncryptedJson, getEncryptedJson } from '../redis-ops'

const slackTeam = {
  set: (teamId, team) => setEncryptedJson(slackTeamKey(teamId), team),
  get: (teamId) => getEncryptedJson(slackTeamKey(teamId))
}

export default slackTeam
