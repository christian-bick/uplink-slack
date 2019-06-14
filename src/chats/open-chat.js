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

export const buildGroupAlreadyExistsMessage = (contactEmail, groupName) => {
  return `Found an existing group for your conversation with ${contactEmail}: ${groupName}`
}

export const buildGroupCreatedMessage = (contactEmail, groupName) => {
  return `Created a new group for your conversation with ${contactEmail}: ${groupName}`
}

export const openChat = (app) => async ({ body, context, ack, say }) => {
  try {
    ack()

    const contactEmail = body.submission.email

    const profileInfo = await app.client.users.profile.get({
      token: context.userToken,
      user: context.userId
    })

    const userEmail = profileInfo.profile.email
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
      say(buildGroupAlreadyExistsMessage(contactEmail, result.group.name))
    } else {
      say(buildGroupCreatedMessage(contactEmail, result.group.name))
    }
  } catch (err) {
    appLog.error(err)
    say(err.message)
  }
}
