import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import redis from '../redis'
import { slackProfileKey, userInvitesKey, userRegistrationKey } from '../redis-keys'
import store from '../store'
import { buildPrimaryActions } from '../entry/entry-actions'

const { text } = object
const { section, divider } = block
const { button } = element

export const LIST_CONTACTS_TEXT = 'Your contact list'
export const LIST_CONTACTS_HEADLINE = 'This is your contact list'

export const listContacts = (app) => async ({ context, say, respond, ack, body }) => {
  ack()
  await replyWithContactList({ context, say, respond, body }, LIST_CONTACTS_HEADLINE)
}

export const listContactsMode = (app) => async ({ action, ack, say, respond, context, body }) => {
  ack()
  const value = action.value
  if (value === 'close') {
    respond({
      delete_original: true
    })
  } else {
    const editable = value === 'edit'
    await replyWithContactList({ context, say, respond, body }, LIST_CONTACTS_HEADLINE, editable)
  }
}

export const replyWithContactList = async ({ context, say, respond, body }, headline, editable) => {
  const message = await generateFullContactListMessage(context, headline, editable)
  if (body && body.message && body.message.text === LIST_CONTACTS_TEXT) {
    respond(message)
  } else {
    say(message)
  }
}

export const buildContactList = async (contactEmailList) => {
  // Get contact registrations
  const contactRegistrationKeys = contactEmailList.map(email => userRegistrationKey(email))
  const regMulti = contactRegistrationKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactRegistrations = await regMulti.execAsync().map(JSON.parse)

  const inviteKeys = contactEmailList.map(email => userInvitesKey(email))
  const inviteMulti = inviteKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const invites = await inviteMulti.execAsync()

  // Get contact profiles
  const contactProfileKeys = contactRegistrations.map(reg => {
    return reg ? slackProfileKey(reg.teamId, reg.userId) : 'not-existing'
  })
  const profileMulti = contactProfileKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactProfiles = await profileMulti.execAsync().map(JSON.parse)

  const contacts = contactEmailList.map((email, index) => ({
    email,
    installed: !!contactRegistrations[index],
    profile: contactProfiles[index],
    invited: !!invites[index]
  }))

  return contacts.sort((left, right) => {
    if (left.installed && !right.installed) {
      return -1
    } else if (!left.installed && right.installed) {
      return 1
    } else if (left.profile && right.profile) {
      return left.profile.name.localeCompare(right.profile.name)
    } else {
      return left.email.localeCompare(right.email)
    }
  })
}

export const generateFullContactListMessage = async (context, headline, editable = false) => {
  const userProfile = await store.slack.profile.get([context.teamId, context.userId])
  const contactEmailList = await store.user.contacts.smembers(userProfile.email)
  const contactList = await buildContactList(contactEmailList)
  return {
    text: LIST_CONTACTS_TEXT,
    blocks: [
      section(
        text(`:notebook_with_decorative_cover: *${headline}*`, TEXT_FORMAT_MRKDWN),
        {
          accessory: editable
            ? button('list-contacts-mode', ':pencil: Stop Editing', { value: 'edit-stop' })
            : button('list-contacts-mode', ':pencil: Edit', { value: 'edit' })
        }
      ),
      divider(),
      ...buildContactBlockList(contactList, editable),
      divider(),
      buildPrimaryActions(context),
      divider()
    ]
  }
}

export const buildContactButton = ({ email, installed, invited, editable }) => {
  if (editable) {
    return button('remove-contact', 'Remove', { value: email })
  } else if (installed) {
    return button('open-chat', 'Message', { value: email })
  } else if (invited) {
    return button('invite-contact', 'Invite Pending', { value: email })
  } else {
    return button('invite-contact', 'Invite', { value: email })
  }
}

export const buildContactBlockList = (contactList, editable) => {
  if (contactList.length === 0) {
    return [
      section(
        text('You haven\'t added any contacts yet.\n\n _Add contacts to see who uses Uplink already, ' +
          'to invite contacts and to get notified when they joined._', TEXT_FORMAT_MRKDWN),
        {
          accessory: button('add-contacts', 'Add Contacts')
        }
      )
    ]
  }
  return contactList.map(({ email, installed, invited, profile: contactProfile }) => (
    section(
      text(contactProfile ? `${contactProfile.name} (${email})` : email, TEXT_FORMAT_MRKDWN),
      {
        accessory: buildContactButton({ email, installed, invited, editable })
      }
    )
  ))
}
