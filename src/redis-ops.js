import redis from './redis'
import { encrypt, decrypt } from './redis-crypto'

const saveMarshal = (entity) => {
  const entityType = typeof entity
  if (entityType !== 'object' && entityType !== 'array') {
    throw new Error('Invalid object passed to convert to JSON. Must be object or array but was ' + entityType)
  } else {
    return JSON.stringify(entity)
  }
}

export const setJson = (key, entity) => redis.setAsync(key, saveMarshal(entity))
export const getJson = (key) => redis.getAsync(key).then((JSON.parse))

export const setEncryptedJson = (key, entity) => redis.setAsync(key, encrypt(saveMarshal(entity)))
export const getEncryptedJson = (key, entity) => redis.getAsync(key).then(decrypt).then(JSON.parse)

export const incrAndExpire = async (key, ttl) => {
  const currentValue = await redis.getAsync(key)
  if (!currentValue) {
    return redis.multi()
      .incr(key)
      .expire(key, ttl)
      .execAsync()
      .then(result => result[0])
  } else {
    return redis.incrAsync(key)
  }
}
