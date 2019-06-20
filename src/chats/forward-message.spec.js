import { forwardMessage } from './forward-message'

describe('forwardMessage', () => {
  let params
  let message
  let say
  let context
  let delegateForwarding
  let delegate
  let app

  beforeEach('prepare', () => {
    message = {}
    context = {}
    app = {}
    delegate = sandbox.fake()
    delegateForwarding = sandbox.fake.returns(delegate)
    params = { message, say, context }
  })

  it('should do some shit', async () => {
    await forwardMessage(app, delegateForwarding)(params)
  })
})
