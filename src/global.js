export const APP_NAME = 'Uplink'
export const INVITE_LINK = 'https://uplink-slack.bleneric.com/oauth/team/request'

export const userAuthLink  = (teamId) => `https://${process.env.HOST}/oauth/user/request?teamId=${teamId}`
export const supportLink = (teamId) => encodeURI(`mailto:support@uplink-chat.com?subject=Support Request (Team ${teamId})`)
