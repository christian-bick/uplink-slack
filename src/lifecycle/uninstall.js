import redis from '../redis'
import { slackTeamKey, slackUsersKey } from '../redis-keys'
import { decrypt } from '../redis-crypto'
import { eventuallyRemovedKeys, immediatelyRemovedKeys } from './lifecycle'
import { appLog } from '../logger'

export const DATA_RETENTION_TIME = 30 * 86400 // 30 days in seconds

export const uninstallTeam = (app) => async ({ context }) => {
  const { teamId } = context
  // Remove data of each team user
  const slackUsers = await redis.hgetallAsync(slackUsersKey(teamId))
    .then(Object.values)
    .map(decrypt)
    .map(JSON.parse)

  const uninstallUserCommands = slackUsers.map(user => uninstallUser(user))

  await Promise.all(uninstallUserCommands)

  // Remove slack team and users to remove bot token
  await redis.delAsync(slackTeamKey(teamId))
  await redis.delAsync(slackUsersKey(teamId))

  appLog.info({ context }, 'app was uninstalled')
}

export const uninstallUser = async (user) => {
  const removeNow = immediatelyRemovedKeys(user)
  const removeLater = eventuallyRemovedKeys(user)

  await removeNow.reduce((multi, key) => multi.del(key), redis.multi()).execAsync()
  await removeLater.reduce((multi, key) => multi.expire(key, DATA_RETENTION_TIME), redis.multi()).execAsync()
}
