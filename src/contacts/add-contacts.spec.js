import redis from '../redis'
import { userRegistrationKey, userContactsKey } from '../redis-keys'
import { addContacts, buildAddContactsMessage } from './add-contacts'
import store from '../store'

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
    const contactName = 'contact-name'
    const contactEmail2 = 'contact-2@b.com'
    const contactProfile = { email: contactEmail, name: contactName }
    const context = { teamId, userId, botToken: 'bot-token' }
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

    const expectReplyWithContacts = (expectedEmails) => {
      const message = buildAddContactsMessage(expectedEmails, profileInfo.profile, context)
      expect(say).to.have.been.calledWith(message)
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
      const contactEntries = await store.user.contacts.smembers(userEmail)
      const mirroredEntries = await store.user.contactsMirrored.smembers(contactEmail)
      expect(contactEntries).to.eql([contactEmail])
      expect(mirroredEntries).to.eql([userEmail])
    })

    it('should create several contacts for several emails and a fresh user', async () => {
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      const contactEntries = await store.user.contacts.smembers(userEmail)
      const mirroredEntriesOne = await store.user.contactsMirrored.smembers(contactEmail)
      const mirroredEntriesTwo = await store.user.contactsMirrored.smembers(contactEmail2)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
      expect(mirroredEntriesOne).to.eql([userEmail])
      expect(mirroredEntriesTwo).to.eql([userEmail])
    })

    it('should add contacts to an existing user', async () => {
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      const contactEntries = await store.user.contacts.smembers(userEmail)
      expect(contactEntries).to.eql([contactEmail, contactEmail2])
    })

    it('should return contact block for an inactive contact', async () => {
      await addContacts(app)(params)
      expectReplyWithContacts([{ email: contactEmail, installed: false }])
    })

    it('should return contact block for active single contact', async () => {
      await store.user.registration.set(contactEmail, contactRegistration)
      await store.slack.profile.set([contactTeamId, contactUserId], contactProfile)
      await addContacts(app)(params)
      expectReplyWithContacts([{ email: contactEmail, profile: contactProfile, installed: true }])
    })

    it('should return contact block for active and inactive contacts', async () => {
      await store.user.registration.set(contactEmail, contactRegistration)
      await store.slack.profile.set([contactTeamId, contactUserId], contactProfile)
      params.body.submission.contacts += `\n${contactEmail2}`
      await addContacts(app)(params)
      expectReplyWithContacts([{ email: contactEmail, profile: contactProfile, installed: true }, { email: contactEmail2, installed: false }])
    })
  })
})
