import redis from './redis'

export const setJson = (key, entity) => redis.setAsync(key, JSON.stringify(entity))
export const setnxJson = (key, entity) => redis.setnxAsync(key, JSON.stringify(entity))
export const getJson = (key) => redis.getAsync(key).then(JSON.parse)
