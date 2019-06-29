import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import { buildInvitationLink } from '../invite/invite-contact'
import redis from '../redis'
import { slackProfileKey, userRegistrationKey } from '../redis-keys'
import store from '../store'

const { text, option } = object
const { section, divider } = block
const { button, overflow } = element

export const buildContactList = async (contactEmailList) => {
  // Get contact registrations
  const contactRegistrationKeys = contactEmailList.map(email => userRegistrationKey(email))
  const regMulti = contactRegistrationKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactRegistrations = await regMulti.execAsync().map(JSON.parse)

  // Get contact profiles
  const contactProfileKeys = contactRegistrations.map(reg => {
    return reg ? slackProfileKey(reg.teamId, reg.userId) : 'not-existing'
  })
  const profileMulti = contactProfileKeys.reduce((multi, key) => multi.get(key), redis.multi())
  const contactProfiles = await profileMulti.execAsync().map(JSON.parse)

  const contacts = contactEmailList.map((email, index) => ({
    email, installed: !!contactRegistrations[index], profile: contactProfiles[index]
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

export const generateFullContactListMessage = async (teamId, userId, editable = false) => {
  const userProfile = await store.slack.profile.get([teamId, userId])
  const contactEmailList = await store.user.contacts.smembers(userProfile.email)
  const contactList = await buildContactList(contactEmailList)
  return {
    blocks: [
      divider(),
      section(
        text('*Your Contact List*', TEXT_FORMAT_MRKDWN),
        {
          accessory: overflow('list-contacts-mode', [
            editable ? option(':pencil: Stop Editing', 'edit-stop') : option(':pencil: Edit Contacts', 'edit'),
            option(':x: Close List', 'close')
          ])
        }
      ),
      divider(),
      ...buildContactBlockList(contactList, userProfile, editable),
      divider()
    ]
  }
}

export const listContacts = (app) => async ({ context, say, ack }) => {
  ack()
  const message = await generateFullContactListMessage(context.teamId, context.userId)
  say(message)
}

export const listContactsMode = (app) => async ({ action, ack, respond, context }) => {
  ack()
  const value = action.selected_option.value
  if (value === 'close') {
    respond({
      delete_original: true
    })
  } else if (value === 'edit') {
    const message = await generateFullContactListMessage(context.teamId, context.userId, true)
    respond(message)
  } else if (value === 'edit-stop') {
    const message = await generateFullContactListMessage(context.teamId, context.userId, false)
    respond(message)
  }
}

export const actionButton = ({ userProfile, email, installed, editable }) => {
  if (editable) {
    return button('remove-contact', 'Remove', { value: email })
  } else if (installed) {
    return button('open-chat', 'Message', { value: email })
  } else {
    return button('invite-contact', 'Invite', { url: buildInvitationLink(email, userProfile) })
  }
}

export const buildContactBlockList = (contactList, userProfile, editable) => contactList.map(({ email, installed, profile: contactProfile }) => (
  section(
    text(contactProfile ? `${contactProfile.name} (${email})` : email, TEXT_FORMAT_MRKDWN),
    {
      accessory: actionButton({ userProfile, email, installed, contactProfile, editable })
    }
  )
))
