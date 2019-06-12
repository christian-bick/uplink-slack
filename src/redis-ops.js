import { slackTeam } from './redis-keys'
import redis from './redis'

export const setJson = (key, entity) => redis.setAsync(slackTeam(key), JSON.stringify(entity))
export const getJson = (key) => redis.getAsync(slackTeam(key)).then(entry => JSON.parse(entry))
