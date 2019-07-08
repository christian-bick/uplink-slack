import { slackConversationKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const slackConversation = {
  set: ([teamId, groupId], group) => setJson(slackConversationKey(teamId, groupId), group),
  get: ([teamId, groupId]) => getJson(slackConversationKey(teamId, groupId))
}

export default slackConversation
