import { findEmailLinks, reduceEmailLinks } from './email'
import redis from '../redis'
import { userRegistration } from '../redis-keys'
import store from '../store'

export const buildContactBlock = ({ email, installed }) => ({
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
    'url': `mailto:${email}`,
    'text': {
      'type': 'plain_text',
      'text': 'Invite',
      'emoji': false
    }
  }
})

export const receiveContacts = (app) => async ({ message, context, body, say }) => {
  const userInfo = await app.client.users.info({
    token: context.botToken,
    user: message.user
  })

  const userEmail = userInfo.user.profile.email

  const contactLinkList = findEmailLinks(message.text)
  const contactEmailList = reduceEmailLinks(contactLinkList)
  await store.user.contacts.sadd(userEmail, contactEmailList)

  const activeContactKeys = contactEmailList.map(email => userRegistration(email))

  // Get active contacts
  let multi = redis.multi()
  activeContactKeys.forEach((key) => {
    multi = multi.get(key)
  })
  const activeContacts = await multi.execAsync()

  const augmentedEmailAddressList = contactEmailList.map((email, index) => ({
    email, installed: !!activeContacts[index]
  }))

  const emailBlocks = augmentedEmailAddressList.map(buildContactBlock)

  say({
    blocks: emailBlocks
  })
}
