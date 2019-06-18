import { slackProfileKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const slackProfile = {
  set: ([ teamId, userId ], profile) => setJson(slackProfileKey(teamId, userId), profile),
  get: ([ teamId, userId ]) => getJson(slackProfileKey(teamId, userId))
}

export default slackProfile
