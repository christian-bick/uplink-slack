import { INVITE_EMAIL, INVITE_LINK, INVITE_NAME, INVITE_IDLE } from '../global'
import store from '../store/index'
import AWS from 'aws-sdk'
import { appLog } from '../logger'
const ses = new AWS.SES({ region: 'eu-west-1' })

export const sendEmailViaSes = async (params) => ses.sendTemplatedEmail(params).promise()

export const inviteContact = (app, sendEmail = sendEmailViaSes, inviteIdle = INVITE_IDLE) => async ({ context, action, ack, say }) => {
  ack()
  const contactEmail = 'christian.bick@uplink-chat.com' || action.value
  const userProfile = await store.slack.profile.get([context.teamId, context.userId])

  const invites = await store.user.invites.get(contactEmail)

  if (invites) {
    appLog.info({ profile: userProfile }, 'invite not sent out (just one invite per day)')
    return
  }

  await store.user.invites.setex(contactEmail, inviteIdle, userProfile.email)

  await sendEmail({
    Destination: {
      ToAddresses: [ contactEmail ]
    },
    Source: `"${INVITE_NAME}" <${INVITE_EMAIL}>`,
    ConfigurationSetName: 'invitations',
    Template: 'invite-contact-v1',
    TemplateData: JSON.stringify({
      sender: {
        name: userProfile.name,
        email: userProfile.email
      },
      recipient: {
        name: 'there'
      },
      inviteLink: INVITE_LINK
    })
  })

  appLog.info({ email: contactEmail, profile: userProfile }, 'invite sent out')
}
