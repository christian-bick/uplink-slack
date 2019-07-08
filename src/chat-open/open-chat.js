import { block, object, element, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import store from '../store/index'
import { appLog } from '../logger'
import { createLink } from './create-link'
import { APP_NAME } from '../global'
import { buildPrimaryActions } from '../entry/entry-actions'
import { BotError } from '../errors'

const { text } = object
const { section, divider } = block
const { button } = element

export const openChat = (app) => async ({ action, body, context, ack, say }) => {
  try {
    let contactAccountId = body && body.submission && body.submission.accountId
    if (!contactAccountId) {
      const contactEmail = action && action.value ? action.value : body.submission.email
      if (!contactEmail) {
        ack({ errors: [{
          name: 'email',
          error: buildNotContactSelected()
        }] })
        return
      }
      ack()
      const contactRegistration = await store.registration.get(contactEmail)
      if (!contactRegistration) {
        say(buildContactNotFoundMessage(context, contactEmail))
        return
      }
      contactAccountId = contactRegistration.accountId
    } else {
      ack()
    }

    if (contactAccountId === context.accountId) {
      say(buildCannotConnectToYourselfMessage())
      return
    }

    const linkResult = await createLink({
      app,
      context,
      sourceAccountId: context.accountId,
      sinkAccountId: contactAccountId
    })

    const contactProfile = await store.account.profile.get([contactAccountId])

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

export const buildNotContactSelected = () => 'Please enter an email address or select an existing contact'

export const buildCannotConnectToYourselfMessage = () => 'Looks like this your own email address.'

export const buildContactNotFoundMessage = (context, contactEmail, inviteSent = false) => {
  return { blocks: [
    section(
      text(`*Looks like this contact is not using ${APP_NAME} yet.*`, TEXT_FORMAT_MRKDWN)
    ),
    divider(),
    inviteSent ? section(
      text(`We just sent out an invite to ${contactEmail} and will let you know when it was accepted.`)
    ) : section(
      text(`Send an invite to ${contactEmail} now.`, TEXT_FORMAT_MRKDWN),
      {
        accessory: button('invite-contact', 'Invite', { value: contactEmail })
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

export const buildNoInputMessage = () => {
  return 'Please enter an email address or select an existing user.'
}

export const buildCreateLinkFailureMessage = (context) =>
  BotError.buildMessage('An unexpected error occurred when creating a link with your contact.', context)
