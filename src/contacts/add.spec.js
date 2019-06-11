import sinon from 'sinon'
import { receiveContacts } from './add'
import redis from '../redis'
import { activeTeamOfUser, contactsOfUser, installedTeamsOfUser } from '../redis-keys'

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
    const contactEmail2 = 'contact-2@b.com'
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

    it('should create user entries for a fresh user', async () => {
      await receiveContacts(app)({ message, context, body, say })
      const activeEntry = await redis.getAsync(activeTeamOfUser(userEmail))
      expect(activeEntry).to.eql(userTeamId)
      const installEntries = await redis.smembersAsync(installedTeamsOfUser(userEmail))
      expect(installEntries).to.eql([userTeamId])
    })

    it('should only update installs for an existing user', async () => {
      const otherTeamId = 'other-team-id'
      redis.setAsync(activeTeamOfUser(userEmail), otherTeamId)
      redis.saddAsync(installedTeamsOfUser(userEmail), otherTeamId)
      await receiveContacts(app)({ message, context, body, say })
      const activeEntry = await redis.getAsync(activeTeamOfUser(userEmail))
      expect(activeEntry).to.eql(otherTeamId)
      const installEntries = await redis.smembersAsync(installedTeamsOfUser(userEmail))
      expect(installEntries).to.eql([otherTeamId, userTeamId])
    })

    it('should add a contact for one email and a fresh user', async () => {
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await redis.smembersAsync(contactsOfUser(userEmail))
      expect(contactEntries).to.eql([contactEmail])
    })

    it('should create several contacts for several emails and a fresh user', async () => {
      message.text += `<mailto:${contactEmail2}|${contactEmail2}>`
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await redis.smembersAsync(contactsOfUser(userEmail))
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should add contacts to an existing user', async () => {
      message.text += `<mailto:${contactEmail2}|${contactEmail2}>`
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await redis.smembersAsync(contactsOfUser(userEmail))
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should return the block of emails for a single email', async () => {
      await receiveContacts(app)({ message, context, body, say })
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
