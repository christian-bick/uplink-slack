import { block, object, element, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

import store from '../store/index'
import { appLog } from '../logger'
import { createLink } from './create-link'
import { APP_NAME } from '../global'
import { buildPrimaryActions } from '../entry/entry-actions'
import { BotError } from '../errors'

const { text } = object
const { section, divider, actions } = block
const { button } = element

export const OPEN_CHAT_QUOTA_LIMIT = 25
export const OPEN_CHAT_QUOTA_WINDOW = 86400 // 24h in seconds

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

    const contactMedium = await store.account.medium.get(contactAccountId)
    if (! contactMedium) {
      say(buildNotInstalled())
      return
    }

    const usage = await store.usage.chats.incr(context.accountId, OPEN_CHAT_QUOTA_WINDOW)
    if (usage > OPEN_CHAT_QUOTA_LIMIT) {
      say(buildQuotaExceededMessage())
      appLog.info({ potentialAbuse: 'spam', context }, 'quota limit for open chat exceeded')
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
        ...buildGroupCreatedMessage({
          userId: context.userId,
          contactName: contactProfile.name,
          contactAccountId
        })
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

export const buildNotInstalled = () => `Looks like this contact is not using ${APP_NAME} anymore`

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

export const buildGroupCreatedMessage = ({ userId, contactName, contactAccountId }, showBlock = false) => {
  return {
    blocks: [
      section(
        text(`<@${userId}> This is the start of your conversation with *${contactName}*.`, TEXT_FORMAT_MRKDWN)
      ),
      divider(),
      section(
        text(`_Note: When sending a message, ${contactName} will see your profile name and picture._`, TEXT_FORMAT_MRKDWN)
      ),
      section(
        text(`_Hint: Adjust the notification settings for this channel to receive notifications._`, TEXT_FORMAT_MRKDWN)
      ),
      divider(),
    ].concat(
      showBlock ? actions([
        button('block-contact', 'Block', { value: contactAccountId })
      ]) : []
    )
  }
}

export const buildQuotaExceededMessage = () => {
  return `You can only open ${OPEN_CHAT_QUOTA_LIMIT} chats per day`
}

export const buildCreateLinkFailureMessage = (context) =>
  BotError.buildMessage('An unexpected error occurred when creating a link with your contact.', context)
