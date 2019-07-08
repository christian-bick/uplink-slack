import { INVITE_EMAIL, INVITE_LINK, INVITE_NAME, inviteContact } from './invite-contact'
import store from '../store'

describe('inviteContact', () => {
  const userAccountId = 'user-account-id'

  const user = {
    teamId: 'team-id',
    userId: 'user-id',
    accountId: userAccountId
  }

  const userProfile = {
    name: 'User Name'
  }

  const contactEmail = 'contact@email.com'

  let app
  let sendEmail
  let action
  let ack
  let context
  let say
  let body
  let respond

  beforeEach(async () => {
    app = {}
    sendEmail = sandbox.fake()

    body = { message: { text: '' } }
    context = { ...user }
    action = { value: contactEmail }
    ack = sandbox.fake()
    say = sandbox.fake()
    respond = sandbox.fake()

    await store.account.profile.set(userAccountId, userProfile)
  })

  describe('not invited yet', () => {
    it('should send out email', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say, respond })
      expect(ack).to.be.calledOnce
      expect(respond).to.be.calledOnce
      expect(sendEmail).to.be.calledWith({
        ConfigurationSetName: 'invitations',
        Destination: { ToAddresses: [contactEmail] },
        Source: `"${INVITE_NAME}" <${INVITE_EMAIL}>`,
        Template: 'invite-contact-v1',
        TemplateData: `{"sender":{"name":"${userProfile.name}"},"recipient":{"name":"there"},"inviteLink":"${INVITE_LINK}"}`
      })
    })
  })

  describe('already invited', () => {
    it('should not send out email when already invited', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say, respond })
      await inviteContact(app, sendEmail)({ context, action, body, ack, say, respond })
      expect(ack).to.be.calledTwice
      expect(say).to.be.calledOnce
      expect(respond).to.be.calledOnce
      expect(sendEmail).to.be.calledOnce
    })
  })

  describe('already registered', () => {
    beforeEach(async () => {
      await store.registration.set(contactEmail, {})
    })

    it('should not send out email when already registered', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say, respond })
      expect(ack).to.be.called
      expect(say).to.be.called
      expect(respond).to.not.be.called
      expect(sendEmail).to.not.be.called
    })
  })
})
