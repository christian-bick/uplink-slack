import { run } from '../../src/server'

describe('Server lifecycle', () => {
  it('should start and stop server', async () => {
    const app = await run(3001)
    await app.stop()
  })
})
