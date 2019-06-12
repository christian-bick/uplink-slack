import jwt from 'jsonwebtoken'
import uuid from 'uuid/v4'
import { promisify } from 'util'
import { oauthLog } from '../logger'
import store from '../store'

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET

const SLACK_USER_SCOPES = ['groups:write']
const SLACK_USER_SCOPES_ENCODED = SLACK_USER_SCOPES.join('%20')
const SLACK_TEAM_SCOPES = ['bot', ...SLACK_USER_SCOPES]
const SLACK_TEAM_SCOPES_ENCODED = SLACK_TEAM_SCOPES.join('%20')

const baseUri = (req) => `https://${req.hostname}`
const successUri = (req) => `${baseUri(req)}/oauth/success`
const errorUri = (req) => `${baseUri(req)}/oauth/error`

const generateStateToken = (payload) => jwt.sign(payload, SLACK_SIGNING_SECRET, { expiresIn: '30 minutes' })

const verifyStateToken = async (token) => promisify(jwt.verify)(token, SLACK_SIGNING_SECRET)

const buildAuthUri = ({ redirectUri, scopes, stateToken, teamId }) => {
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
      successUri: successUri(req),
      verificationCode: uuid(),
      redirectUri
    })

    const authUri = buildAuthUri({
      redirectUri,
      stateToken,
      scopes: SLACK_TEAM_SCOPES_ENCODED
    })
    resp.redirect(302, authUri)
    oauthLog.info('Team auth requested')
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
      successUri: successUri(req),
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
    oauthLog.info('User auth requested')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const grantForTeam = (app) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { successUri, redirectUri } = await verifyStateToken(stateToken)
    const authInfo = await verifyAuthCode(app, code, redirectUri)
    const team = extractTeam(authInfo)
    const user = extractUser(authInfo)
    await store.slackTeam.set(team.teamId, team)
    await store.slackUser.set(user.userId, user)
    resp.redirect(successUri)
    oauthLog.info('Team auth granted')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const grantForUser = (app) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { successUri, redirectUri } = await verifyStateToken(stateToken)
    const authInfo = await verifyAuthCode(app, code, redirectUri)
    const user = extractUser(authInfo)
    await store.slackUser.set(user.userId, user)
    resp.redirect(successUri)
    oauthLog.info('User auth granted')
  } catch (err) {
    oauthLog.error(err)
    resp.redirect(302, errorUri(req))
  }
}

export const success = (req, resp) => {
  resp.status(200).send('Installation finished. Check back to Slack now.')
}

export const error = (req, resp) => {
  resp.status(200).send('Installation failed. Please try again.')
}

export default (app) => {
  app.receiver.app.get('/oauth/team/request', requestForTeam)
  app.receiver.app.get('/oauth/user/request', requestForUser)
  app.receiver.app.get('/oauth/team/grant', grantForTeam(app))
  app.receiver.app.get('/oauth/user/grant', grantForUser(app))
  app.receiver.app.get('/oauth/success', success)
  app.receiver.app.get('/oauth/error', error)
}
