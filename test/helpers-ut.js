import redis from '../src/redis'

afterEach('clean up sandbox', async () => {
  sandbox.restore()
})

afterEach('clean up redis', async () => {
  await redis.flushdbAsync()
})
