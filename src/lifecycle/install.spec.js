import store from '../store'
import { installUser } from './install'

describe('installUser', () => {
  const userId = 'user-id'
  const teamId = 'team-id'
  const email = 'user@email.com'
  const name = 'user-name'
  const avatar = 'user-image'
  const userToken = 'user-token'
  const botToken = 'bot-token'
  const botId = 'bot-id'
  const scope = 'scope'

  const user = { teamId, userId, userToken, scope }
  const team = { teamId, botId, botToken }

  let app

  beforeEach(async () => {
    app = { client: { users: { profile: {
      get: sandbox.fake.returns({ profile: { real_name: name, image_48: avatar, email } })
    } } } }
  })

  describe('with passed team', () => {
    let result

    beforeEach(async () => {
      result = await installUser(app)({ user, team })
    })

    it('should return entities', async () => {
      expect(result.registration).to.exist
      expect(result.profile).to.exist
      expect(result.team).to.exist
      expect(result.user).to.exist
      expect(result.existed).to.exist
    })

    it('should return correct user', async () => {
      expect(result.user.accountId).to.exist
      expect(result.user.userId).to.eql(userId)
      expect(result.user.teamId).to.eql(teamId)
      expect(result.user.userToken).to.eql(userToken)
    })

    it('should return correct profile', async () => {
      expect(result.profile.email).to.eql(email)
      expect(result.profile.avatar).to.eql(avatar)
      expect(result.profile.name).to.eql(name)
    })

    it('should return correct registration', async () => {
      expect(result.registration.accountId).to.exist
      expect(result.registration.createDate).to.exist
    })

    it('should persist team', async () => {
      const slackTeam = await store.slack.team.get(teamId)
      expect(slackTeam).to.eql(team)
      expect(slackTeam).to.eql(result.team)
    })

    it('should persist entities', async () => {
      const accountId = result.user.accountId
      const slackUser = await store.slack.user.get([teamId, userId])
      const profile = await store.account.profile.get(accountId)
      const medium = await store.account.medium.get(accountId)
      const registration = await store.registration.get(email)
      expect(slackUser).to.eql(result.user)
      expect(profile).to.eql(result.profile)
      expect(medium).to.eql(result.medium)
      expect(registration).to.eql(result.registration)
    })
  })

  describe('without passed team', () => {
    beforeEach(async () => {
      await store.slack.team.set(teamId, team)
    })

    it('should retrieve team', async () => {
      const result = await installUser(app)({ user })
      expect(result.team).to.eql(team)
    })
  })
})
