import { block, object, element, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import store from '../store/index'
import { appLog } from '../logger'
import { createLink } from './create-link'
import { APP_NAME, userAuthLink } from '../global'
import { buildInvitationLink } from '../invite/invite-contact'
import { buildPrimaryActions } from '../entry/entry-actions'
import { BotError } from '../errors'

const { text } = object
const { section, divider } = block
const { button } = element

export const openChat = (app) => async ({ action, body, context, ack, say }) => {
  try {
    ack()

    const contactEmail = action && action.value ? action.value : body.submission.email

    const userProfile = await store.slack.profile.get([context.teamId, context.userId])
    if (userProfile.email === contactEmail) {
      say(buildCannotConnectToYourselfMessage(contactEmail))
      return
    }

    const userRegistration = await store.user.registration.get(userProfile.email)
    if (!userRegistration) {
      say(buildRegistrationNotFoundMessage(context))
      return
    }

    await store.user.contacts.sadd(userProfile.email, [ contactEmail ])

    const contactRegistration = await store.user.registration.get(contactEmail)
    if (!contactRegistration) {
      await say(buildContactNotFoundMessage(context, contactEmail, userProfile))
      return
    }

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
        text: buildGroupAlreadyExistsMessage(context, contactEmail)
      })
    } else {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: linkResult.link.channelId,
        text: buildGroupCreatedMessage(context, contactEmail)
      })
    }
  } catch (err) {
    appLog.error(err)
    if (err.reply) {
      say(err.generateMessage())
    } else {
      say(buildCreateLinkFailureMessage(context))
    }
  }
}

export const buildCannotConnectToYourselfMessage = (contactEmail) => {
  return `Looks like this your own email address: ${contactEmail}`
}

export const buildRegistrationNotFoundMessage = (context) => {
  return { blocks: [
    section(
      text(`Looks like you haven't installed ${APP_NAME} yet.`),
      {
        accessory: button('user-install-init', 'Install', {
          url: userAuthLink(context)
        })
      }
    )
  ] }
}

export const buildContactNotFoundMessage = (context, contactEmail, userProfile) => {
  return { blocks: [
    section(
      text(`:warning: *Looks like your contact is not using ${APP_NAME} yet.*`, TEXT_FORMAT_MRKDWN)
    ),
    divider(),
    section(
      text(`But you can always send an invite to ${contactEmail}.`, TEXT_FORMAT_MRKDWN),
      {
        accessory: button('invite-contact', 'Invite', {
          url: buildInvitationLink(contactEmail, userProfile)
        })
      }
    ),
    divider(),
    buildPrimaryActions(context),
    divider()
  ] }
}

export const buildGroupAlreadyExistsMessage = ({ userId }, contactEmail) => {
  return `<@${userId}> This is your ongoing conversation with ${contactEmail}`
}

export const buildGroupCreatedMessage = ({ userId }, contactEmail) => {
  return `<@${userId}> This is your new conversation with ${contactEmail}. I will forward your messages and reply on behalf of your contact.\n\n
  _Please note that your contact will be able to see your profile name and profile picture for this workspace._`
}

export const buildCreateLinkFailureMessage = (context) =>
  BotError.buildMessage('An unexpected error occurred when creating a link with your contact.', context)
