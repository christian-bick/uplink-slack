import redis from '../redis'
import { userRegistration, userContacts } from '../redis-keys'
import { receiveContacts, buildContactBlock } from './add'
import store from '../store'

describe('contacts', () => {
  let app = { client: { users: { profile: {} } } }
  let say

  beforeEach('set up', () => {
    say = sandbox.fake()
  })

  describe('receiveContacts', () => {
    const teamId = 'team-1'
    const userId = 'user-1'
    const contactTeamId = 'team-2'
    const contactUserId = 'user-2'
    const userEmail = 'user-1@b.com'
    const contactEmail = 'contact-1@b.com'
    const contactEmail2 = 'contact-2@b.com'
    const context = { botToken: 'bot-token' }
    const body = { team_id: teamId, user_id: userId }
    const contactRegistration = {
      platform: 'slack',
      teamId: contactTeamId,
      userId: contactUserId
    }
    let message

    beforeEach('set up', () => {
      app.client.users.profile.get = sandbox.fake.returns({ profile: { email: userEmail } })
      message = {
        user: 'user-1',
        text: `<mailto:${contactEmail}|${contactEmail}>`
      }
    })

    const expectReplyWithEmails = (expectedEmails) => {
      const generatedBlocks = expectedEmails.map(buildContactBlock)
      expect(say).to.have.been.calledWith({ blocks: generatedBlocks })
    }

    it('should only update installs for an existing user', async () => {
      const otherTeamId = 'other-team-id'
      redis.setAsync(userRegistration(userEmail), JSON.stringify({
        platform: 'slack',
        userId: 'other-user-id',
        teamId: otherTeamId
      }))
      await receiveContacts(app)({ message, context, body, say })
      const registration = await store.user.registration.get(userEmail)
      expect(registration.teamId).to.eql(otherTeamId)
    })

    it('should add a contact for one email and a fresh user', async () => {
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await redis.smembersAsync(userContacts(userEmail))
      expect(contactEntries).to.eql([contactEmail])
    })

    it('should create several contacts for several emails and a fresh user', async () => {
      message.text += `<mailto:${contactEmail2}|${contactEmail2}>`
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await store.user.contacts.smembers(userEmail)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should add contacts to an existing user', async () => {
      message.text += `<mailto:${contactEmail2}|${contactEmail2}>`
      await receiveContacts(app)({ message, context, body, say })
      const contactEntries = await store.user.contacts.smembers(userEmail)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should return contact block for an inactive contact', async () => {
      await receiveContacts(app)({ message, context, body, say })
      expectReplyWithEmails([{ email: contactEmail, installed: false }])
    })

    it('should return email block for active single contact', async () => {
      await redis.setAsync(userRegistration(contactEmail), contactRegistration)
      await receiveContacts(app)({ message, context, body, say })
      expectReplyWithEmails([{ email: contactEmail, installed: true }])
    })

    it('should return contact block for active and inactive contacts', async () => {
      await redis.setAsync(userRegistration(contactEmail), contactRegistration)
      message.text += `<mailto:${contactEmail2}|${contactEmail2}>`
      await receiveContacts(app)({ message, context, body, say })
      expectReplyWithEmails([{ email: contactEmail, installed: true }, { email: contactEmail2, installed: false }])
    })
  })
})
