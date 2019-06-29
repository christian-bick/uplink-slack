import { block, object, element, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import store from '../store/index'
import { appLog } from '../logger'
import { createLink } from './create-link'
import { APP_NAME, userAuthLink } from '../global'
import { buildInvitationLink } from '../invite/invite-contact'

const { text } = object
const { section } = block
const { button } = element

export const openChat = (app) => async ({ action, body, context, ack, say }) => {
  try {
    ack()

    const contactEmail = action ? action.value : body.submission.email

    const userProfile = await store.slack.profile.get([context.teamId, context.userId])
    if (userProfile.email === contactEmail) {
      say(buildCannotConnectToYourselfMessage(contactEmail))
      return
    }

    const userRegistration = await store.user.registration.get(userProfile.email)
    if (!userRegistration) {
      say(buildRegistrationNotFoundMessage(context.teamId))
      return
    }

    const contactRegistration = await store.user.registration.get(contactEmail)
    if (!contactRegistration) {
      say(buildContactNotFoundMessage(contactEmail, userProfile))
      return
    }

    await store.user.contacts.sadd(userProfile.email, [ contactEmail ])

    const linkResult = await createLink({
      app,
      context,
      source: userRegistration,
      sink: contactRegistration
    })

    if (linkResult.alreadyExisted) {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: linkResult.link.channelId,
        text: buildGroupAlreadyExistsMessage(context.userId, contactEmail)
      })
    } else {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: linkResult.link.channelId,
        text: buildGroupCreatedMessage(context.userId, contactEmail)
      })
    }
  } catch (err) {
    appLog.error(err)
    say(err.message)
  }
}

export const buildCannotConnectToYourselfMessage = (contactEmail) => {
  return `Looks like this your own email address: ${contactEmail}`
}

export const buildRegistrationNotFoundMessage = (teamId) => {
  return { blocks: [
      section(
        text(`Looks like you haven't installed ${APP_NAME} yet.`),
        {
          accessory: button('user-install-init', 'Install', {
            url: userAuthLink(teamId)
          })
        }
      )
    ] }
}

export const buildContactNotFoundMessage = (contactEmail, userProfile) => {
  return { blocks: [
      section(
        text(`Looks like your contact is not using ${APP_NAME} yet. We couldn't find someone with the email address ${contactEmail}.`, TEXT_FORMAT_MRKDWN),
        {
          accessory: button('invite-contact', 'Invite', {
            url: buildInvitationLink(contactEmail, userProfile)
          })
        }
      )
    ] }
}

export const buildGroupAlreadyExistsMessage = (userId, contactEmail) => {
  return `<@${userId}> This is your ongoing conversation with ${contactEmail}`
}

export const buildGroupCreatedMessage = (userId, contactEmail) => {
  return `<@${userId}> This is your new conversation with ${contactEmail}. I will forward your messages and reply on behalf of your contact.`
}
