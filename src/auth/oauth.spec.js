import {
  buildAuthUri,
  generateStateToken,
  verifyStateToken,
  requestForTeam,
  requestForUser,
  grantForTeam,
  grantForUser,
  errorUri, SLACK_CLIENT_ID
} from './oauth'
import { omit } from 'lodash'
import store from '../store'

describe('oauth', () => {
  const userId = 'user-id'
  const teamId = 'team-id'
  const userEmail = 'user-email'
  const userName = 'user-name'
  const userToken = 'user-token'
  const botToken = 'bot-token'
  const botId = 'bot-id'
  const scope = 'scope'

  describe('generateStateToken, verifyStateToken', () => {
    const payload = {
      successUri: 'success-uri',
      verificationCode: 'verification-code',
      redirectUri: 'redirect-uri'
    }

    it('should generate a verifiable token', async () => {
      const token = generateStateToken(payload)
      const verifiedPayload = await verifyStateToken(token)
      expect(omit(verifiedPayload, ['exp', 'iat'])).to.eql(payload)
    })
  })

  describe('buildAuthUri', () => {
    const redirectUri = 'redirect-uri'
    const scopes = 'scopes'
    const stateToken = 'state-token'

    it('should build URI without teamId', () => {
      const uri = buildAuthUri({ redirectUri, scopes, stateToken })
      expect(uri).to.equal(`https://slack.com/oauth/authorize?scope=scopes&client_id=${SLACK_CLIENT_ID}&redirect_uri=redirect-uri&state=state-token&`)
    })

    it('should build URI with teamId', () => {
      const uri = buildAuthUri({ redirectUri, scopes, stateToken, teamId })
      expect(uri).to.equal(`https://slack.com/oauth/authorize?scope=scopes&client_id=${SLACK_CLIENT_ID}&redirect_uri=redirect-uri&state=state-token&team=team-id`)
    })
  })

  describe('auth requests', () => {
    const req = { hostname: 'host.com', query: { teamId } }
    const resp = { }

    beforeEach('prepare', () => {
      resp.redirect = sandbox.fake()
    })

    describe('requestForTeam', () => {
      it('should redirect to Slack', async () => {
        await requestForTeam(req, resp)
        expect(resp.redirect).to.be.calledOnce
        expect(resp.redirect).to.not.be.calledWith(302, errorUri(req))
      })
    })

    describe('requestForUser', () => {
      it('should redirect to Slack', async () => {
        await requestForUser(req, resp)
        expect(resp.redirect).to.be.calledOnce
        expect(resp.redirect).to.not.be.calledWith(302, errorUri(req))
      })
    })
  })

  describe('auth granting', () => {
    const app = { client: { users: { profile: {} } } }
    const req = { hostname: 'host', query: { code: 'code' } }
    const redirectUri = 'redirectUri'
    const resp = {}

    const profile = {
      real_name: userName,
      email: userEmail
    }

    const userAuthInfo = { team_id: teamId, user_id: userId, access_token: userToken, scope }
    const teamAuthInfo = { ...userAuthInfo, bot: { bot_user_Id: botId, bot_access_token: botToken } }

    let verifyAuth
    let verifyState

    beforeEach('prepare', () => {
      verifyState = sandbox.fake.returns({ redirectUri })
      app.client.users.profile.get = sandbox.fake.returns({ profile })
      resp.redirect = sandbox.fake()
    })

    const expectUserRegistered = async () => {
      const registration = await store.user.registration.get(userEmail)
      const slackUser = await store.slack.user.get([teamId, userId])
      const slackProfile = await store.slack.profile.get([teamId, userId])
      expect(registration).to.eql({ platform: 'slack', teamId, userId, email: userEmail })
      expect(slackUser).to.eql({ teamId, userId, userToken, scope })
      expect(slackProfile).to.eql({ email: userEmail, name: userName })
    }

    describe('grantForTeam', () => {
      beforeEach('prepare', () => {
        verifyAuth = sandbox.fake.returns(teamAuthInfo)
      })

      it('should redirect to success uri', async () => {
        await grantForTeam(app, verifyAuth, verifyState)(req, resp)
        expect(resp.redirect).to.be.calledOnce
        expect(resp.redirect).to.not.be.calledWith(302, errorUri(req))
        const team = await store.slack.team.get(teamId)
        expect(team).to.eql({ teamId, botToken })
        await expectUserRegistered()
      })
    })

    describe('grantForUser', () => {
      beforeEach('prepare', async () => {
        verifyAuth = sandbox.fake.returns(userAuthInfo)
        await store.slack.team.set(teamId, { teamId })
      })

      it('should redirect to success uri', async () => {
        await grantForUser(app, verifyAuth, verifyState)(req, resp)
        expect(resp.redirect).to.be.calledOnce
        expect(resp.redirect).to.not.be.calledWith(302, errorUri(req))
        await expectUserRegistered()
      })
    })
  })
})
