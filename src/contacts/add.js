import { extractEmails } from './email'
import redis from '../redis'
import { userRegistrationKey } from '../redis-keys'
import store from '../store'
import { APP_NAME, INVITE_LINK } from '../global'

const INVITE_SUBJECT = 'We can talk through Slack now'
const inviteBody = (sender) => 'Hi! How is it going?\n\n' +
  `I just installed ${APP_NAME} on my Slack team to finally move away from emails.\n\n` +
  'When you also install the app on your Slack team then we can write each other directly from Slack in the future.\n\n' +
  `Here is the link: ${INVITE_LINK}\n\n` +
  `Best ${sender.real_name}`

export const buildContactBlockList = (augmentedEmailAddressList, userProfile) => augmentedEmailAddressList.map(({email, installed}) => ({
  'type': 'section',
  'text': {
    'type': 'mrkdwn',
    'text': email
  },
  'accessory': installed ? {
    'type': 'button',
    'action_id': 'open-chat',
    'text': {
      'type': 'plain_text',
      'text': 'Message',
      'emoji': false
    },
    'value': email
  } : {
    'type': 'button',
    'url': encodeURI(`mailto:${email}?subject=${INVITE_SUBJECT}&body=${inviteBody(userProfile)}`),
    'text': {
      'type': 'plain_text',
      'text': 'Invite',
      'emoji': false
    }
  }
}))

export const addContacts = (app) => async ({ context, body, say, ack }) => {
  ack()
  const { profile } = await app.client.users.profile.get({
    token: context.userToken,
    user: context.userId
  })

  const userEmail = profile.email

  const contactEmailList = extractEmails(body.submission.contacts)
  await store.user.contacts.sadd(userEmail, contactEmailList)

  const activeContactKeys = contactEmailList.map(email => userRegistrationKey(email))

  // Get active contacts
  let multi = redis.multi()
  activeContactKeys.forEach((key) => {
    multi = multi.get(key)
  })
  const activeContacts = await multi.execAsync()

  const augmentedEmailAddressList = contactEmailList.map((email, index) => ({
    email, installed: !!activeContacts[index]
  }))

  const emailBlocks = buildContactBlockList(augmentedEmailAddressList, profile)
  say({
    blocks: emailBlocks
  })
}
