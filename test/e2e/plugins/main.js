import redis from '../../../src/redis'
import store from '../../../src/store'
import { blacklisted, buildCurrent } from '../fixtures/users'

module.exports = (on, config) => {
  const current = buildCurrent(config)
  on('task', {
    async resetDb () {
      return redis.flushdbAsync()
    },
    async prepareCurrentUser () {
      console.log(current)
      await store.registration.set(current.profile.email, { accountId: current.user.accountId })
      await store.slack.team.set(current.user.teamId, current.team)
      await store.slack.user.set([current.user.teamId, current.user.userId], current.user)
      await store.account.profile.set(current.user.accountId, current.profile)
      await store.account.medium.set(current.user.accountId, {
        platform: 'slack',
        teamId: current.user.teamId,
        userId: current.userId
      })
      return null
    },
    async prepareBlacklist () {
      await store.account.profile.set(blacklisted.user.accountId, blacklisted.profile)
      await store.account.blacklist.sadd(current.user.accountId, [ blacklisted.user.accountId ])
      return null
    }
  })
}
