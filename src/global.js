import { obfuscateValue } from './obfuscate'

export const APP_NAME = 'Uplink'

export const INVITE_LINK = 'https://www.uplink-chat.com'
export const INVITE_NAME = 'Uplink Chat'
export const INVITE_EMAIL = 'invite@uplink-chat.com'
export const INVITE_IDLE = 86400 // 24h in seconds

  export const userAuthLink = ({ teamId }) => `https://${process.env.HOST}/oauth/user/request?teamId=${teamId}`
export const supportLink = ({ teamId, userId }) =>
  encodeURI(`mailto:support@uplink-chat.com?subject=Support Request (team: ${obfuscateValue(teamId)}, user: ${obfuscateValue(userId)})`)
