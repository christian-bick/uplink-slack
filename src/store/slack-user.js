import { slackUsersKey } from '../redis-keys'
import { hsetEncryptedJson, hgetEncryptedJson } from '../redis-ops'

const slackUser = {
  set: ([ teamId, userId ], user) => hsetEncryptedJson(slackUsersKey(teamId), userId, user),
  get: ([ teamId, userId ]) => hgetEncryptedJson(slackUsersKey(teamId), userId)
}

export default slackUser
