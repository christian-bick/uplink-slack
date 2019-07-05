import store from '../store'
import { LIST_CONTACTS_HEADLINE, replyWithContactList } from './list-contacts'

export const removeContact = (app) => async ({ context, action, body, ack, say, respond }) => {
  ack()
  const userProfile = await store.slack.profile.get([context.teamId, context.userId])
  const contactEmail = action.value
  await store.user.contacts.srem(userProfile.email, contactEmail)
  await replyWithContactList({ context, say, respond, body }, LIST_CONTACTS_HEADLINE, true)
}
