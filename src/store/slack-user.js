import { slackUserKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const slackUser = {
  set: ([ teamId, userId ], user) => setJson(slackUserKey(teamId, userId), user),
  get: ([ teamId, userId ]) => getJson(slackUserKey(teamId, userId))
}

export default slackUser
