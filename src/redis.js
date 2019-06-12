import Promise from 'bluebird'

let redis
if (process.env.REDIS_MOCK === 'true') {
  redis = require('redis-mock')
} else {
  redis = require('redis')
}

Promise.promisifyAll(redis)

const client = redis.createClient({
  host: process.env.REDIS_HOST
})

export default client
