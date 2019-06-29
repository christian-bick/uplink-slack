import { buildInvitationLink } from '../invite/invite-contact'
import redis from '../redis'
import { slackProfileKey, userRegistrationKey } from '../redis-keys'
import store from '../store'

export const buildContactList = async (contactEmailList) => {
  // Get contact registrations
  const contactRegistrationKeys = contactEmailList.map(email => userRegistrationKey(email))
  const regMulti = contactRegistrationKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactRegistrations = await regMulti.execAsync()

  // Get contact profiles
  const contactProfileKeys = contactRegistrations.map(reg => {
    return reg ? slackProfileKey(reg.teamId, reg.userId) : 'not-existing'
  })
  const profileMulti = contactProfileKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactProfiles = await profileMulti.execAsync()

  return contactEmailList.map((email, index) => ({
    email, installed: !!contactRegistrations[index], profile: contactProfiles[index]
  }))
}

export const listContacts = (app) => async ({ context, say, ack }) => {
  ack()
  const userProfile = await  store.slack.profile.get([context.teamId, context.userId])
  const contactEmailList = await store.user.contacts.smembers(userProfile.email)
  const contactList = await  buildContactList(contactEmailList)
  say({
    blocks: buildContactBlockList(contactList, userProfile)
  })
}

export const buildContactBlockList = (contactList, userProfile) => contactList.map(({ email, installed }) => ({
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
    'action_id': 'invite-contact',
    'url': buildInvitationLink(email, userProfile),
    'text': {
      'type': 'plain_text',
      'text': 'Invite',
      'emoji': false
    }
  }
}))
