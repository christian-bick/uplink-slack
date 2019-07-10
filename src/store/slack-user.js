import { slackUserKey } from '../redis-keys'
import { getEncryptedJson, setEncryptedJson } from '../redis-ops'

const slackUser = {
  set: ([ teamId, userId ], user) => setEncryptedJson(slackUserKey(teamId, userId), user),
  get: ([ teamId, userId ]) => getEncryptedJson(slackUserKey(teamId, userId))
}

export default slackUser
