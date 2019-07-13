import store from '../store'
import { appLog } from '../logger'

export const blockContact = (app) => async ({ context, action, ack }) => {
  ack()
  const contactAccountId = action.value
  await store.account.blacklist.sadd(context.accountId, [ contactAccountId ])
  await store.account.contacts.srem(context.accountId, contactAccountId)

  const link = await store.account.link.get([ context.accountId, contactAccountId ])
  if (link) {
    try {
      app.client.conversations.archive({
        token: context.userToken,
        channel: link.channelId
      })
    } catch (err) {
      if (err.data && ( err.data.error === 'is_archived' || err.data.error === 'channel_not_found' )) {
        appLog.debug({ context, link }, 'channel already archived or deleted')
      } else {
        throw err
      }
    }
  }
}
