import jwt from 'jsonwebtoken'
import uuid from 'uuid/v4'
import { promisify } from 'util'
import { appLog } from '../logger'
import store from '../store'
import { installUser } from '../lifecycle/install'
import { sendInstallNotifications } from '../lifecycle/install-notifications'

export const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET

const SLACK_USER_SCOPES = ['groups:write', 'groups:read', 'users.profile:read']
const SLACK_USER_SCOPES_ENCODED = SLACK_USER_SCOPES.join('%20')
const SLACK_TEAM_SCOPES = ['bot', ...SLACK_USER_SCOPES]
const SLACK_TEAM_SCOPES_ENCODED = SLACK_TEAM_SCOPES.join('%20')

const oauthLog = appLog.child({ module: 'oauth' }, true)

const baseUri = (req) => `https://${req.hostname}`

export const successUri = (req, team) => `${baseUri(req)}/oauth-success.html?teamId=${team.teamId}&botId=${team.botId}`
export const errorUri = (req) => `${baseUri(req)}/oauth-error.html`
export const teamAuthUri = (req) => `${baseUri(req)}/oauth/team/request`

export const generateStateToken = (payload) => jwt.sign(payload, SLACK_SIGNING_SECRET, { expiresIn: '30 minutes' })
export const verifyStateToken = async (token) => promisify(jwt.verify)(token, SLACK_SIGNING_SECRET)

export const buildAuthUri = ({ redirectUri, scopes, stateToken, teamId }) => {
  return `https://slack.com/oauth/authorize?${[
    `scope=${scopes}`,
    `client_id=${SLACK_CLIENT_ID}`,
    `redirect_uri=${redirectUri}`,
    `state=${stateToken}`,
    teamId ? `team=${teamId}` : ''
  ].join('&')}`
}

const verifyAuthCode = (app, code, redirectUri) => app.client.oauth.access({
  client_id: SLACK_CLIENT_ID,
  client_secret: SLACK_CLIENT_SECRET,
  redirect_uri: redirectUri,
  code
})

const extractUser = ({ team_id: teamId, user_id: userId, access_token: userToken, scope }) => ({
  teamId, userId, userToken, scope
})

const extractTeam = ({ team_id: teamId, bot: { bot_user_id: botId, bot_access_token: botToken } }) => ({
  teamId, botId, botToken
})

export const requestForTeam = (req, resp) => {
  try {
    const redirectUri = `${baseUri(req)}/oauth/team/grant`

    const stateToken = generateStateToken({
      verificationCode: uuid(),
      redirectUri
    })

    const authUri = buildAuthUri({
      redirectUri,
      stateToken,
      scopes: SLACK_TEAM_SCOPES_ENCODED
    })
    resp.redirect(302, authUri)
    oauthLog.info({ action: 'request-team-auth' }, 'team auth requested')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const requestForUser = async (req, resp) => {
  try {
    const teamId = req.query.teamId

    // When the team does not exist we redirect to install for teams
    if (teamId) {
      const team = await store.slack.team.get(teamId)
      if (!team) {
        resp.redirect(302, teamAuthUri(req))
        return
      }
    }

    const redirectUri = `${baseUri(req)}/oauth/user/grant`

    const stateToken = generateStateToken({
      verificationCode: uuid(),
      redirectUri
    })

    const authUri = buildAuthUri({
      redirectUri,
      stateToken,
      scopes: SLACK_USER_SCOPES_ENCODED,
      teamId
    })
    resp.redirect(302, authUri)
    oauthLog.info({ action: 'request-user-auth', teamId: teamId }, 'user auth requested')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const grantForTeam = (app, verifyAuth = verifyAuthCode, verifyState = verifyStateToken, sendNotifications = sendInstallNotifications) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { redirectUri } = await verifyState(stateToken)
    const authInfo = await verifyAuth(app, code, redirectUri)
    const team = extractTeam(authInfo)
    const user = extractUser(authInfo)
    const { profile, registration, email, existed } = await installUser(app)({ team, user })

    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-team-auth', teamId: team.teamId, userId: user.userId }, 'team auth granted')

    await sendNotifications(app)({ profile, user, team, registration, email, existed })
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const grantForUser = (app, verifyAuth = verifyAuthCode, verifyState = verifyStateToken, sendNotifications = sendInstallNotifications) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { redirectUri } = await verifyState(stateToken)
    const authInfo = await verifyAuth(app, code, redirectUri)
    const user = extractUser(authInfo)
    const { profile, team, registration, email, existed } = await installUser(app)({ user })

    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-user-auth', teamId: team.teamId, userId: user.userId }, 'user auth granted')

    await sendNotifications(app)({ profile, user, team, registration, email, existed })
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export default (app) => {
  app.receiver.app.get('/oauth/team/request', requestForTeam)
  app.receiver.app.get('/oauth/user/request', requestForUser)
  app.receiver.app.get('/oauth/team/grant', grantForTeam(app))
  app.receiver.app.get('/oauth/user/grant', grantForUser(app))
}
