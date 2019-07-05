import { extractEmails } from './email'
import store from '../store'
import { replyWithContactList } from './list-contacts'
import { userContactsMirroredKey } from '../redis-keys'
import redis from '../redis'

export const ADD_CONTACTS_HEADLINE = 'Successfully added contacts your list'

export const addContacts = (app) => async ({ context, say, respond, ack, body }) => {
  ack()
  const profile = await store.slack.profile.get([context.teamId, context.userId])
  const contactEmailList = extractEmails(body.submission.contacts)

  await store.user.contacts.sadd(profile.email, contactEmailList)
  await contactEmailList.reduce(
    (multi, contactEmail) =>
      multi.sadd(userContactsMirroredKey(contactEmail), profile.email), redis.multi()
  ).execAsync()

  await replyWithContactList({ context, say, respond }, ADD_CONTACTS_HEADLINE)
}
