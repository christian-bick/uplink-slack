import redis from '../redis'
import { userRegistrationKey, userContactsKey } from '../redis-keys'
import { addContacts } from './add-contacts'
import store from '../store'
import { buildContactBlockList } from './list-contacts'

describe('contacts', () => {
  let app = { client: { users: { profile: {} } } }
  let say
  let ack

  beforeEach('set up', () => {
    say = sandbox.fake()
    ack = sandbox.fake()
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
    const profileInfo = { profile: { email: userEmail, real_name: 'Chris' } }
    const contactRegistration = {
      platform: 'slack',
      teamId: contactTeamId,
      userId: contactUserId
    }

    let params
    let body

    beforeEach('set up', () => {
      app.client.users.profile.get = sandbox.fake.returns(profileInfo)
      body = {
        team_id: teamId,
        user_id: userId,
        submission: { contacts: contactEmail }
      }
      params = { context, body, say, ack }
    })

    const expectReplyWithEmails = (expectedEmails) => {
      const generatedBlocks = buildContactBlockList(expectedEmails, profileInfo.profile)
      expect(say).to.have.been.calledWith({ blocks: generatedBlocks })
    }

    it('should only update installs for an existing user', async () => {
      const otherTeamId = 'other-team-id'
      redis.setAsync(userRegistrationKey(userEmail), JSON.stringify({
        platform: 'slack',
        userId: 'other-user-id',
        teamId: otherTeamId
      }))
      await addContacts(app)(params)
      const registration = await store.user.registration.get(userEmail)
      expect(registration.teamId).to.eql(otherTeamId)
    })

    it('should add a contact for one email and a fresh user', async () => {
      await addContacts(app)(params)
      const contactEntries = await redis.smembersAsync(userContactsKey(userEmail))
      expect(contactEntries).to.eql([contactEmail])
    })

    it('should create several contacts for several emails and a fresh user', async () => {
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      const contactEntries = await store.user.contacts.smembers(userEmail)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should add contacts to an existing user', async () => {
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      const contactEntries = await store.user.contacts.smembers(userEmail)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should return contact block for an inactive contact', async () => {
      await addContacts(app)(params)
      expectReplyWithEmails([{ email: contactEmail, installed: false }])
    })

    it('should return email block for active single contact', async () => {
      await redis.setAsync(userRegistrationKey(contactEmail), contactRegistration)
      await addContacts(app)(params)
      expectReplyWithEmails([{ email: contactEmail, installed: true }])
    })

    it('should return contact block for active and inactive contacts', async () => {
      await redis.setAsync(userRegistrationKey(contactEmail), contactRegistration)
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      expectReplyWithEmails([{ email: contactEmail, installed: true }, { email: contactEmail2, installed: false }])
    })
  })
})
