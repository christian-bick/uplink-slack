import store from '../store'
import redis from '../redis'
import { accountProfileKey } from '../redis-keys'

export const listContactsAsOptions = (app) => async ({ body, context, ack }) => {
  const searchString = body.value
  const contacts = await store.account.contacts.smembers(context.accountId)
  const contactProfiles = await contacts.reduce((multi, accountId) => multi.get(accountProfileKey(accountId)), redis.multi()).execAsync().map(JSON.parse)
  const zippedProfiles = contacts.map((accountId, index) => ({ ...contactProfiles[index], accountId }))

  const filteredProfiles = zippedProfiles.filter(profile => profile.name.includes(searchString))

  const options = filteredProfiles.map(profile => ({
    label: profile.name,
    value: profile.accountId
  }))

  await ack({ options })
}
