import store from '../store'
import {decrypt} from "../redis-crypto"
import redis from "../redis"
import {accountProfileKey} from "../redis-keys"

export const manageBlacklistDialog = (app) => async ({ context, body, ack, say }) => {
  ack()

  const blacklistedAccountIds = await store.account.blacklist.smembers(context.accountId)

  if (blacklistedAccountIds.length === 0) {
    say('Your blacklist is empty')
  }

  const contactProfiles = await blacklistedAccountIds.reduce(
    (multi, accountId) => multi.get(accountProfileKey(accountId)),
    redis.multi()
  ).execAsync().map(decrypt).map(JSON.parse)

  const zippedProfiles = blacklistedAccountIds.map((accountId, index) => ({ ...contactProfiles[index], accountId }))

  await app.client.dialog.open(buildBlacklistDialog(context.botToken, body.trigger_id, zippedProfiles))
}

const buildBlacklistDialog = (token, triggerId, profiles) => ({
  'token': token,
  'trigger_id': triggerId,
  'dialog': {
    'callback_id': 'unblock-contact',
    'title': 'Manage Blacklist',
    'submit_label': 'Remove',
    'elements': [{
        'type': 'select',
        'label': 'Select someone you blocked',
        'name': 'accountId',
        'options': profiles.map(profile => ({
          label: profile.name,
          value: profile.accountId
        }))
      }
    ]
  }
})
