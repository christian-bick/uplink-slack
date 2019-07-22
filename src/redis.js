import Promise from 'bluebird'

let redis
if (process.env.REDIS_MOCK === 'true') {
  redis = require('redis-mock')
  redis.RedisClient.prototype.persist = (key, cb) => cb(null, 0)
} else {
  redis = require('redis')
}

Promise.promisifyAll(redis)

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
})

export default client
