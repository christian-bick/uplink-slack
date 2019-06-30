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

    const contactProfile = await store.slack.profile.get([contactRegistration.teamId, contactRegistration.userId])

    if (linkResult.alreadyExisted) {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: linkResult.link.channelId,
        text: buildGroupAlreadyExistsMessage(context, contactProfile.name)
      })
    } else {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: linkResult.link.channelId,
        text: buildGroupCreatedMessage(context, contactProfile.name)
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

export const buildGroupAlreadyExistsMessage = ({ userId }, userName) => {
  return `<@${userId}> This is your ongoing conversation with *${userName}*.`
}

export const buildGroupCreatedMessage = ({ userId }, userName) => {
  return `<@${userId}> This is your new conversation with *${userName}*. I will forward messages between the two of you within this group.\n\n
  _When sending messages, ${userName} will see your profile name and picture for this workspace._\n
  _To block ${userName}, simply archive this channel (but don't delete it)._`
}

export const buildCreateLinkFailureMessage = (context) =>
  BotError.buildMessage('An unexpected error occurred when creating a link with your contact.', context)
