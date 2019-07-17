import redis from '../redis'
import { mappingDmKey } from '../redis-keys'

const MAPPING_RETENTION_TIME = 30 * 86400

const mappingDm = {
  set: (mappingId, mappedId) => redis.setexAsync(mappingDmKey(mappingId), MAPPING_RETENTION_TIME, mappedId),
  get: (mappingId) => redis.multi()
      .get(mappingDmKey(mappingId))
      .expire(mappingDmKey(mappingId), MAPPING_RETENTION_TIME)
      .execAsync()
      .then(result => result[0]),
  del: (mappingId) => redis.delAsync(mappingDmKey(mappingId))
}

export default mappingDm
