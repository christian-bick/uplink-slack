/* eslint-disable no-unreachable */
import redis from './redis'
import { setEncryptedJson } from './redis-ops'
import { migrationLog } from './logger'

const KEYS_TO_MIGRATE = [ 'slack-user:*', 'slack-team:*', 'account-profile:*' ]

const encryptEntry = async (key) => {
  try {
    const value = await redis.getAsync(key)
    try {
      const entity = JSON.parse(value)
      await setEncryptedJson(key, entity)
      migrationLog.info({ key }, 'encrypted key')
    } catch (err) {
      migrationLog.debug({ key }, 'already encrypted key')
    }
  } catch (err) {
    migrationLog.error(err)
  }
}

const migrateKeys = (pattern) => {
  try {
    migrationLog.info('migrating keys', pattern)
    return redis.keysAsync(pattern).map(encryptEntry)
  } catch (err) {
    migrationLog.error(err)
  }
}

export const migrate = async () => {
  // DISABLED
  return
  migrationLog.info('starting migration')
  const migrations = KEYS_TO_MIGRATE.map(migrateKeys)
  await Promise.all(migrations)
}
