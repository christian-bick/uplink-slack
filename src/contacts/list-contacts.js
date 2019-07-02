import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import { buildInvitationLink } from './invite-contact'
import redis from '../redis'
import { slackProfileKey, userRegistrationKey } from '../redis-keys'
import store from '../store'
import {buildPrimaryActions} from "../entry/entry-actions"

const { text } = object
const { section, divider } = block
const { button } = element

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

export const generateFullContactListMessage = async (context, editable = false) => {
  const userProfile = await store.slack.profile.get([context.teamId, context.userId])
  const contactEmailList = await store.user.contacts.smembers(userProfile.email)
  const contactList = await buildContactList(contactEmailList)
  return {
    blocks: [
      section(
        text(':notebook_with_decorative_cover: *This is your contact list*', TEXT_FORMAT_MRKDWN),
        {
          accessory: editable
            ? button('list-contacts-mode', ':pencil: Stop Editing', { value: 'edit-stop' })
            : button('list-contacts-mode', ':pencil: Edit', { value: 'edit' })
        }
      ),
      divider(),
      ...buildContactBlockList(contactList, userProfile, editable),
      divider(),
      buildPrimaryActions(context),
      divider()
    ]
  }
}

export const listContacts = (app) => async ({ context, say, ack }) => {
  ack()
  const message = await generateFullContactListMessage(context)
  say(message)
}

export const listContactsMode = (app) => async ({ action, ack, respond, context }) => {
  ack()
  const value = action.value
  if (value === 'close') {
    respond({
      delete_original: true
    })
  } else if (value === 'edit') {
    const message = await generateFullContactListMessage(context, true)
    respond(message)
  } else if (value === 'edit-stop') {
    const message = await generateFullContactListMessage(context, false)
    respond(message)
  }
}

export const buildContactButton = ({ userProfile, email, installed, editable }) => {
  if (editable) {
    return button('remove-contact', 'Remove', { value: email })
  } else if (installed) {
    return button('open-chat', 'Message', { value: email })
  } else {
    return button('invite-contact', 'Invite', { value: email } /*, { url: buildInvitationLink(email, userProfile) } */)
  }
}

export const buildContactBlockList = (contactList, userProfile, editable) => {
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
  return contactList.map(({ email, installed, profile: contactProfile }) => (
    section(
      text(contactProfile ? `${contactProfile.name} (${email})` : email, TEXT_FORMAT_MRKDWN),
      {
        accessory: buildContactButton({ userProfile, email, installed, contactProfile, editable })
      }
    )
  ))
}
