import jwt from 'jsonwebtoken'
import uuid from 'uuid/v4'
import { promisify } from 'util'
import { appLog } from '../logger'
import store from '../store'

export const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET

const SLACK_USER_SCOPES = ['groups:write', 'groups:read', 'groups:history', 'users.profile:read']
const SLACK_USER_SCOPES_ENCODED = SLACK_USER_SCOPES.join('%20')
const SLACK_TEAM_SCOPES = ['bot', ...SLACK_USER_SCOPES]
const SLACK_TEAM_SCOPES_ENCODED = SLACK_TEAM_SCOPES.join('%20')

const oauthLog = appLog.child({ module: 'oauth' }, true)

const baseUri = (req) => `https://${req.hostname}`

export const successUri = (req, team) => `${baseUri(req)}/oauth-success.html?teamId=${team.teamId}&botId=${team.botId}`
export const errorUri = (req) => `${baseUri(req)}/oauth-error.html`

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

const registerUser = async (app, user) => {
  const { profile } = await app.client.users.profile.get({
    token: user.userToken,
    user: user.userId
  })

  await store.user.registration.set(profile.email, {
    platform: 'slack',
    teamId: user.teamId,
    userId: user.userId,
    email: profile.email
  })

  await store.slack.user.set([user.teamId, user.userId], {
    ...user
  })

  await store.slack.profile.set([user.teamId, user.userId], {
    email: profile.email,
    name: profile.real_name || profile.display_name,
    image48: profile.image_48
  })
}

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

export const requestForUser = (req, resp) => {
  try {
    const redirectUri = `${baseUri(req)}/oauth/user/grant`
    const teamId = req.query.teamId

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

export const grantForTeam = (app, verifyAuth = verifyAuthCode, verifyState = verifyStateToken) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { redirectUri } = await verifyState(stateToken)
    const authInfo = await verifyAuth(app, code, redirectUri)
    const team = extractTeam(authInfo)
    const user = extractUser(authInfo)
    await store.slack.team.set(team.teamId, team)
    await registerUser(app, user)
    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-team-auth', teamId: team.teamId, userId: user.userId }, 'team auth granted')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const grantForUser = (app, verifyAuth = verifyAuthCode, verifyState = verifyStateToken) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { redirectUri } = await verifyState(stateToken)
    const authInfo = await verifyAuth(app, code, redirectUri)
    const user = extractUser(authInfo)
    const team = await store.slack.team.get(user.teamId)
    await registerUser(app, user)
    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-user-auth', teamId: team.teamId, userId: user.userId }, 'user auth granted')
  } catch (err) {
    console.log(err)
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
