import { APP_NAME, INVITE_LINK } from '../global'

export const INVITE_SUBJECT = 'We can talk through Slack now'
export const inviteBody = (profile) => 'Hi! How is it going?\n\n' +
  `I just installed ${APP_NAME} on my Slack team to finally move away from emails.\n\n` +
  'When you also install the app on your Slack team then we can write each other directly from Slack in the future.\n\n' +
  `Here is the link: ${INVITE_LINK}\n\n` +
  `Best ${profile.name}`

export const buildInvitationLink = (contactEmail, userProfile) =>
  encodeURI(`mailto:${contactEmail}?subject=${INVITE_SUBJECT}&body=${inviteBody(userProfile)}`)
