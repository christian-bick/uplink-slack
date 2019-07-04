import { extractEmails } from './email'
import store from '../store'
import { buildContactBlockList, buildContactList } from './list-contacts'
import { block, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'
import { buildPrimaryActions } from '../entry/entry-actions'
import { userContactsMirroredKey } from '../redis-keys'
import redis from '../redis'

const { text } = object
const { section, divider } = block

export const addContacts = (app) => async ({ context, body, say, ack }) => {
  ack()
  const { profile } = await app.client.users.profile.get({
    token: context.userToken,
    user: context.userId
  })

  const userEmail = profile.email

  const contactEmailList = extractEmails(body.submission.contacts)

  await store.user.contacts.sadd(userEmail, contactEmailList)
  await contactEmailList.reduce(
    (multi, contactEmail) =>
      multi.sadd(userContactsMirroredKey(contactEmail), userEmail), redis.multi()
  ).execAsync()

  const contactList = await buildContactList(contactEmailList)
  say(buildAddContactsMessage(contactList, profile, context))
}

export const buildAddContactsMessage = (contactList, profile, context) => ({
  blocks: [
    section(
      text(':heavy_check_mark: *The following contacts have been added to your list*', TEXT_FORMAT_MRKDWN)
    ),
    divider(),
    ...buildContactBlockList(contactList),
    divider(),
    buildPrimaryActions(context),
    divider()
  ]
})
