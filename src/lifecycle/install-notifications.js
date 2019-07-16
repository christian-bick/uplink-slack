import store from '../store'
import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'
import { appLog } from '../logger'

const { text } = object
const { section, divider } = block
const { button } = element

export const sendInstallNotifications = (app) => async ({ profile, user, registration, existed }) => {
  const name = profile.name
  const accountId = registration.accountId
  try {
    if (existed) {
      appLog.info('skipped notifications (existing registration')
      return
    }
    const invitingAccountId = await store.invites.get(profile.email)
    if (!invitingAccountId) {
      appLog.info('skipped notifications (no mirrored contacts')
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
          text(`${name} (${profile.email})`, TEXT_FORMAT_MRKDWN),
          {
            accessory: button('open-chat', 'Message', { value: profile.email })
          }
        ),
        divider()
      ]
    })
    appLog.info({ accountId, registration }, 'notification sent out')
  } catch (err) {
    appLog.error({ err, registration }, 'notification sending failed')
  }
}
