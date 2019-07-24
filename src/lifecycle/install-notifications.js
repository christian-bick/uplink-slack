import store from '../store'
import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'
import { appLog } from '../logger'

const { text } = object
const { section, divider } = block
const { button } = element

export const sendInviteNotification = (app) => async ({ profile, user, registration, existed }) => {
  try {
    if (existed) {
      appLog.info('skipped invite notifications (existing registration)')
      return
    }
    const invitingAccountId = await store.invites.get(profile.email)
    if (!invitingAccountId) {
      appLog.info('skipped invite notifications (no invites)')
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
      text: `${profile.name} just joined uplink`,
      blocks: [
        section(
          text(`<@${invitingMedium.userId}>* Someone you invited just joined Uplink*`, TEXT_FORMAT_MRKDWN)
        ),
        divider(),
        section(
          text(`${profile.name} (${profile.email})`, TEXT_FORMAT_MRKDWN),
          {
            accessory: button('open-chat', 'Message', { value: profile.email })
          }
        ),
        divider()
      ]
    })
    appLog.info({ registration }, 'sent invite notification')
  } catch (err) {
    appLog.error({ err, registration }, 'sending invite notification failed')
  }
}

export const sendWelcomeMessage = (app) => async ({ profile, user, team, registration }) => {
  try {
    const { channel: appHome } = await app.client.im.open({
      user: user.userId,
      token: team.botToken
    })
    await app.client.chat.postMessage({
      token: team.botToken,
      channel: appHome.id,
      text: `<@${user.userId}> You are ready to go!`
    })
    appLog.info({ registration }, 'sent welcome message')
  } catch (err) {
    appLog.error({ err, registration }, 'sending welcome message failed')
  }
}

export const sendInstallNotifications = (app) => async (params) => {
  appLog.debug('send out notifications')
  await sendWelcomeMessage(app)(params)
  await sendInviteNotification(app)(params)
}
