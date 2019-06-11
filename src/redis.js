import redisMock from 'redis-mock'
import Promise from 'bluebird'

let redis = redisMock.createClient()
Promise.promisifyAll(redis)

export default redis
