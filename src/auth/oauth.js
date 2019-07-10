import jwt from 'jsonwebtoken'
import uuid from 'uuid/v4'
import { promisify } from 'util'
import { appLog } from '../logger'
import store from '../store'
import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

const { text } = object
const { section, divider } = block
const { button } = element

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
  const { profile: slackProfile } = await app.client.users.profile.get({
    token: user.userToken,
    user: user.userId
  })

  const existingRegistration = await store.registration.get(slackProfile.email)

  const registration = existingRegistration || {
    accountId: uuid(),
    createDate: Date.now()
  }

  const profile = {
    name: slackProfile.display_name || slackProfile.real_name,
    avatar: slackProfile.image_48,
    email: slackProfile.email
  }

  const medium = {
    platform: 'slack',
    teamId: user.teamId,
    userId: user.userId
  }

  await store.registration.set(slackProfile.email, registration)
  await store.account.profile.set(registration.accountId, profile)
  await store.account.medium.set(registration.accountId, medium)
  await store.slack.user.set([user.teamId, user.userId], { ...user, accountId: registration.accountId })

  oauthLog.info({ user, profile, registration, existed: !!existingRegistration }, 'user registered')
  return { profile, registration, email: slackProfile.email, existed: !!existingRegistration }
}

const sendInstallNotifications = async ({ app, profile, registration, email, existed }) => {
  const name = profile.name
  const accountId = registration.accountId
  try {
    if (existed) {
      oauthLog.info('skipped notifications (existing registration')
      return
    }
    const invitingAccountId = await store.invites.get(email)
    if (!invitingAccountId) {
      oauthLog.info('skipped notifications (no mirrored contacts')
      return
    }
    const invitingMedium = await store.account.medium.get(invitingAccountId)
    const invitingSlackTeam = await store.slack.team.get(invitingMedium.teamId)
    const { channel } = await app.client.im.open({
      token: invitingSlackTeam.botToken,
      user: invitingMedium.userId
    })
    await app.client.chat.postMessage({
      token: invitingSlackTeam.botToken,
      channel: channel.id,
      text: `${name} just joined uplink`,
      blocks: [
        section(
          text(`<@${invitingMedium.userId}>* Someone you invited just joined Uplink*`, TEXT_FORMAT_MRKDWN)
        ),
        divider(),
        section(
          text(`${name} (${email})`, TEXT_FORMAT_MRKDWN),
          {
            accessory: button('open-chat', 'Message', { value: email })
          }
        ),
        divider()
      ]
    })
    oauthLog.info({ accountId, registration }, 'notification sent out')
  } catch (err) {
    oauthLog.error({ err, registration }, 'notification sending failed')
  }
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

export const grantForTeam = (app, verifyAuth = verifyAuthCode, verifyState = verifyStateToken, sendNotifications = sendInstallNotifications) => async (req, resp) => {
  try {
    const { code, state: stateToken } = req.query
    const { redirectUri } = await verifyState(stateToken)
    const authInfo = await verifyAuth(app, code, redirectUri)
    const team = extractTeam(authInfo)
    const user = extractUser(authInfo)
    await store.slack.team.set(team.teamId, team)
    const { profile, registration, email, existed } = await registerUser(app, user)

    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-team-auth', teamId: team.teamId, userId: user.userId }, 'team auth granted')

    await sendNotifications({ app, profile, registration, email, existed })
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
    const team = await store.slack.team.get(user.teamId)
    const { profile, registration, email, existed } = await registerUser(app, user)

    resp.redirect(302, successUri(req, team))
    oauthLog.info({ action: 'grant-user-auth', teamId: team.teamId, userId: user.userId }, 'user auth granted')

    await sendNotifications({ app, profile, registration, email, existed })
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
