import redis from '../src/redis'

afterEach('restore up sandbox', async () => {
  sandbox.restore()
})

afterEach('flush redis', async () => {
  await redis.flushdbAsync()
})
