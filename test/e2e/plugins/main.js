import redis from '../../../src/redis'
import store from '../../../src/store'
import { blacklisted } from '../fixtures/users'
import { WebClient } from '@slack/web-api'

const persistIdentity = async (identity) => {
  await store.registration.set(identity.profile.email, { accountId: identity.user.accountId })
  await store.slack.team.set(identity.user.teamId, identity.team)
  await store.slack.user.set([identity.user.teamId, identity.user.userId], identity.user)
  await store.account.profile.set(identity.user.accountId, identity.profile)
  return store.account.medium.set(identity.user.accountId, {
    platform: 'slack',
    teamId: identity.user.teamId,
    userId: identity.user.userId
  })
}

const buildUser = (prefix, config, { name }) => ({
  profile: {
    name,
    email: config.env[`${prefix}_EMAIL`]
  },
  team: {
    teamId: config.env[`${prefix}_TEAM_ID`],
    botToken: config.env[`${prefix}_TEAM_BOT_TOKEN`],
    botId: config.env[`${prefix}_TEAM_BOT_ID`]
  },
  user: {
    teamId: config.env[`${prefix}_TEAM_ID`],
    userId: config.env[`${prefix}_USER_ID`],
    userToken: config.env[`${prefix}_ADMIN_TOKEN`],
    accountId: `${prefix}_ACCOUNT_ID`
  }
})

const deleteDmChannels = async (token) => {
  const client = new WebClient(token)
  const { channels } = await client.conversations.list({ types: 'public_channel' })
  channels.filter(({ name }) => name.startsWith('dm-')).forEach(async ({id}) => {
    await client.apiCall('channels.delete', { channel: id })
  })
}

module.exports = (on, config) => {
  const current = buildUser('CURRENT', config, { name: 'General Current' })
  const contact = buildUser('CONTACT', config, { name: 'Major Contact' })
  on('task', {
    async resetSlack () {
      await deleteDmChannels(config.env.CURRENT_ADMIN_TOKEN)
      await deleteDmChannels(config.env.CONTACT_ADMIN_TOKEN)
      return null
    },
    async resetDb () {
      return redis.flushdbAsync()
    },
    async prepareCurrentUser () {
      return persistIdentity(current)
    },
    async prepareContactUser () {
      return persistIdentity(contact)
    },
    async prepareBlacklist () {
      await store.account.profile.set(blacklisted.user.accountId, blacklisted.profile)
      await store.account.blacklist.sadd(current.user.accountId, [ blacklisted.user.accountId ])
      return null
    }
  })
}
