import { SERVER_ADDRESS } from '../test-server'
import request from 'co-request'

describe('Health check', () => {

  it('should return 200 on root', async () => {
    const resp = await request(`${SERVER_ADDRESS}/`)
    expect(resp.statusCode).to.equal(200)
  })
})
