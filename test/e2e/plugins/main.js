import store from '../../../src/store'
import { blacklisted } from '../fixtures/users'

module.exports = (on, config) => {
  on('task', {
    async prepareBlacklist () {
      const email = config.env.E2E_EMAIL
      const { accountId } = await store.registration.get(email)
      await store.account.profile.set(blacklisted.accountId, blacklisted.profile)
      await store.account.blacklist.sadd(accountId, [ blacklisted.accountId ])
      return null
    }
  })
}
