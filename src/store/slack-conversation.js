import { slackConversationsKey } from '../redis-keys'
import { hgetJson, hsetJson } from '../redis-ops'

const slackConversation = {
  set: ([teamId, channelId], group) => hsetJson(slackConversationsKey(teamId), channelId, group),
  get: ([teamId, channelId]) => hgetJson(slackConversationsKey(teamId), channelId)
}

export default slackConversation
