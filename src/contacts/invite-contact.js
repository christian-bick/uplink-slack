import store from '../store/index'
import AWS from 'aws-sdk'
import { appLog } from '../logger'
import { buildContactNotFoundMessage } from '../chat-open/open-chat'

export const INVITE_LINK = 'https://www.uplink-chat.com'
export const INVITE_NAME = 'Uplink Chat'
export const INVITE_EMAIL = 'invite@uplink-chat.com'
export const INVITE_IDLE = 86400 // 24h in seconds
export const INVITE_QUOTA_LIMIT = 25
export const INVITE_QUOTA_WINDOW = 86400 // 24h in seconds

const ses = new AWS.SES({ region: 'eu-west-1' })

export const sendEmailViaSes = async (params) => ses.sendTemplatedEmail(params).promise()

export const inviteContact = (app, sendEmail = sendEmailViaSes, inviteIdle = INVITE_IDLE) => async ({ context, action, body, ack, say, respond }) => {
  ack()
  const contactEmail = action.value

  const registration = await store.registration.get(contactEmail)
  if (registration) {
    appLog.info({ context, email: contactEmail }, 'invite not sent out (existing registration)')
    say(`The email address ${contactEmail} is already registered and you can start a conversation at any time.`)
    return
  }

  const invite = await store.invites.get(contactEmail)
  if (invite) {
    appLog.info({ context, email: contactEmail }, 'invite not sent out (existing invite)')
    say(`We already sent out an invite to ${contactEmail} lately.`)
    return
  }

  const usage = await store.usage.invites.incr(context.accountId, INVITE_QUOTA_WINDOW)
  if (usage > INVITE_QUOTA_LIMIT) {
    appLog.info({ potentialAbuse: true, context, email: contactEmail }, 'invite not sent out (quota exceeded)')
    say('You can only invite 25 contacts per day.')
    return
  }

  const userProfile = await store.account.profile.get(context.accountId)
  await store.invites.setex(contactEmail, inviteIdle, context.accountId)

  await sendEmail({
    Destination: {
      ToAddresses: [ contactEmail ]
    },
    Source: `"${INVITE_NAME}" <${INVITE_EMAIL}>`,
    ConfigurationSetName: 'invitations',
    Template: 'invite-contact-v1',
    TemplateData: JSON.stringify({
      sender: {
        name: userProfile.name
      },
      recipient: {
        name: 'there'
      },
      inviteLink: INVITE_LINK
    })
  })

  respond(buildContactNotFoundMessage(context, contactEmail, true))

  appLog.info({ email: contactEmail, context }, 'invite sent out')
}
