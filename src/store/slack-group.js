import { slackGroupKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const slackGroup = {
  set: ([teamId, groupId], group) => setJson(slackGroupKey(teamId, groupId), group),
  get: ([teamId, groupId]) => getJson(slackGroupKey(teamId, groupId))
}

export default slackGroup
