import { obfuscateValue } from './obfuscate'

export const userAuthLink = ({ teamId }) => `https://${process.env.HOST}/oauth/user/request?teamId=${teamId}`
export const supportLink = ({ teamId, userId }) =>
  encodeURI(`mailto:support@uplink-chat.com?subject=Support Request (team: ${obfuscateValue(teamId)}, user: ${obfuscateValue(userId)})`)
