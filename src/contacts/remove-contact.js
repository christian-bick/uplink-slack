import store from '../store'
import {generateFullContactListMessage} from "./list-contacts"

export const removeContact = (app) => async ({ context, action, ack, respond }) => {
  ack()
  const userProfile = await store.slack.profile.get([context.teamId, context.userId])
  const contactEmail = action.value
  await store.user.contacts.srem(userProfile.email, contactEmail)
  const message = await generateFullContactListMessage(context.teamId, context.userId, true)
  respond(message)
}
