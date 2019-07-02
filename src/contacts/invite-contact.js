import { APP_NAME, INVITE_LINK } from '../global'
import store from '../store/index'
import AWS from 'aws-sdk'
const ses = new AWS.SES({ region: 'eu-west-1' })

export const INVITE_SUBJECT = 'We can talk through Slack now'
export const inviteBody = (profile) => 'Hi! How is it going?\n\n' +
  `I just installed ${APP_NAME} on my Slack team to finally move away from emails.\n\n` +
  'When you also install the app on your Slack team then we can write each other directly from Slack in the future.\n\n' +
  `Here is the link: ${INVITE_LINK}\n\n` +
  `Best ${profile.name}`

export const buildInvitationLink = (contactEmail, userProfile) =>
  encodeURI(`mailto:${contactEmail}?subject=${INVITE_SUBJECT}&body=${inviteBody(userProfile)}`)

export const sendEmailViaSes = async (params) => ses.sendTemplatedEmail(params).promise()

export const inviteContact = (app, sendEmail = sendEmailViaSes) => async ({ context, action, ack }) => {
  ack()

  const contactEmail = 'christian.bick@uplink-chat.com' // action.value

  const userProfile = await store.slack.profile.get([context.teamId, context.userId])

  await sendEmail({
    Destination: {
      ToAddresses: [
        contactEmail
      ]
    },
    Source: '"Uplink Chat" <invitation@uplink-chat.com>', /* required */
    ConfigurationSetName: 'invitations',
    Template: 'invite-contact-v1', /* required */
    TemplateData: JSON.stringify({
      sender: {
        name: userProfile.name,
        email: userProfile.email
      },
      recipient: {
        name: 'there'
      }
    })
  })
}
