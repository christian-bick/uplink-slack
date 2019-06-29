import { extractEmails } from './email'
import store from '../store'
import { buildContactBlockList, buildContactList } from './list-contacts'

export const addContacts = (app) => async ({ context, body, say, ack }) => {
  ack()
  const { profile } = await app.client.users.profile.get({
    token: context.userToken,
    user: context.userId
  })

  const userEmail = profile.email

  const contactEmailList = extractEmails(body.submission.contacts)
  await store.user.contacts.sadd(userEmail, contactEmailList)
  const contactList = await buildContactList(contactEmailList)
  say({
    blocks: buildContactBlockList(contactList, profile)
  })
}
