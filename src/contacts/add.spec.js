import sinon from 'sinon'
import { receiveContacts } from './add'
import redis from '../redis'

describe('contacts', () => {
  const sandbox = sinon.createSandbox()
  let app = { client: { users: { } } }
  let say

  beforeEach('set up', () => {
    say = sandbox.fake()
  })

  afterEach('clean up', async () => {
    sandbox.restore()
    await redis.flushdbAsync()
  })

  describe('receiveContacts', () => {
    const userTeamId = 'team-1'
    const userEmail = 'user-1@b.com'
    const contactEmail = 'contact-1@b.com'
    const context = { botToken: 'bot-token' }
    const body = { team_id: userTeamId }
    let message

    beforeEach('set up', () => {
      app.client.users.info = sandbox.fake.returns({ user: { profile: { email: userEmail } } })
      message = {
        user: 'user-1',
        text: `<mailto:${contactEmail}|${contactEmail}>`
      }
    })

    it('should create single entry for a fresh users', async () => {
      await receiveContacts(app)({ message, context, body, say })
      const activeEntry = await redis.getAsync(`active-${userEmail}`)
      expect(activeEntry).to.eql(userTeamId)
      const installEntry = await redis.smembersAsync(`install-${userEmail}`)
      expect(installEntry).to.eql([userTeamId])
      const contactEntry = await redis.smembersAsync(`contact-${userEmail}`)
      expect(contactEntry).to.eql([contactEmail])
      expect(say).to.have.been.calledWith({ blocks: [{
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': contactEmail
        }
      }] })
    })
  })
})
