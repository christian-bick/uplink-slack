import redis from './redis'

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
