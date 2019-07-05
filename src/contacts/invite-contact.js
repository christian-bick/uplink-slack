import { INVITE_EMAIL, INVITE_LINK, INVITE_NAME, INVITE_IDLE } from '../global'
import store from '../store/index'
import AWS from 'aws-sdk'
import { appLog } from '../logger'
import { LIST_CONTACTS_TEXT, replyWithContactList } from './list-contacts'
import {ADD_CONTACTS_HEADLINE} from "./add-contacts"
const ses = new AWS.SES({ region: 'eu-west-1' })

export const sendEmailViaSes = async (params) => ses.sendTemplatedEmail(params).promise()

export const inviteContact = (app, sendEmail = sendEmailViaSes, inviteIdle = INVITE_IDLE) => async ({ context, action, body, ack, say, respond }) => {
  ack()
  const contactEmail = action.value

  const registration = await store.user.registration.get(contactEmail)
  if (registration) {
    appLog.info({ email: contactEmail }, 'invite not sent out (existing registration)')
    say(`The email address ${contactEmail} is already registered and you can start a conversation at any time.`)
    return
  }

  const invites = await store.user.invites.get(contactEmail)
  if (invites) {
    appLog.info({ email: contactEmail }, 'invite not sent out (existing invite)')
    say(`We already sent out an invite to ${contactEmail} lately.`)
    return
  }

  const userProfile = await store.slack.profile.get([context.teamId, context.userId])
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

  if (body.message.text === LIST_CONTACTS_TEXT) {
    await replyWithContactList({ context, say, respond, body }, ADD_CONTACTS_HEADLINE)
  }

  say(`We just sent out an invite to ${contactEmail} and will let you know when it was accepted.`)

  appLog.info({ email: contactEmail, profile: userProfile }, 'invite sent out')
}
