import store from '../store'
import { appLog } from '../logger'
import { createSlackLink } from './create-slack-link'

export const buildCannotConnectToYourselfMessage = (contactEmail) => {
  return `Looks like this your own email address: ${contactEmail}`
}

export const buildRegistrationNotFoundMessage = (contactEmail) => {
  return `Looks like you are not registered with your email yet.`
}

export const buildContactNotFoundMessage = (contactEmail) => {
  return `I don't know a user with this email address: ${contactEmail}`
}

export const buildGroupAlreadyExistsMessage = (userId, contactEmail) => {
  return `<@${userId}> Here is your ongoing conversation with ${contactEmail}`
}

export const buildGroupCreatedMessage = (userId, contactEmail) => {
  return `<@${userId}> This is your new conversation with ${contactEmail}. I will forward messages between the two of you within this group.`
}

export const openChat = (app) => async ({ body, context, ack, say }) => {
  try {
    ack()

    const contactEmail = body.submission.email

    const { email: userEmail } = await store.slackUser.get(context.userId)
    if (userEmail === contactEmail) {
      say(buildCannotConnectToYourselfMessage(contactEmail))
      return
    }

    const userRegistration = await store.user.registration.get(userEmail)
    if (!userRegistration) {
      say(buildRegistrationNotFoundMessage(contactEmail))
      return
    }

    const contactRegistration = await store.user.registration.get(contactEmail)
    if (!contactRegistration) {
      say(buildContactNotFoundMessage(contactEmail))
      return
    }

    const result = await createSlackLink({
      app,
      context,
      source: userRegistration,
      sink: contactRegistration
    })

    if (result.alreadyExisted) {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: result.group.id,
        text: buildGroupAlreadyExistsMessage(context.userId, contactEmail)
      })
    } else {
      await app.client.chat.postMessage({
        token: context.botToken,
        channel: result.group.id,
        text: buildGroupCreatedMessage(context.userId, contactEmail)
      })
    }
  } catch (err) {
    appLog.error(err)
    say(err.message)
  }
}
