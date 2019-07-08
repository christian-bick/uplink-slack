import { inviteContact } from './invite-contact'
import store from '../store'
import { INVITE_EMAIL, INVITE_LINK, INVITE_NAME } from '../global'

describe.skip('inviteContact', () => {
  const user = {
    teamId: 'team-id',
    userId: 'user-id'
  }

  const userProfile = {
    name: 'User Name',
    email: 'user@example.com'
  }

  const contactProfile = {
    name: 'Contact Name',
    email: 'contact@example.com'
  }

  let app
  let sendEmail
  let action
  let ack
  let context
  let say
  let body

  beforeEach(async () => {
    app = {}
    sendEmail = sandbox.fake()

    body = { message: { text: '' }}
    context = { ...user }
    action = { value: contactProfile.email }
    ack = sandbox.fake()
    say = sandbox.fake()

    await store.slack.profile.set([user.teamId, user.userId], userProfile)
  })

  describe('not invited yet', () => {
    it('should send out email', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say })
      expect(ack).to.be.calledOnce
      expect(say).to.be.calledOnce
      expect(sendEmail).to.be.calledWith({
        ConfigurationSetName: 'invitations',
        Destination: { ToAddresses: [contactProfile.email] },
        Source: `"${INVITE_NAME}" <${INVITE_EMAIL}>`,
        Template: 'invite-contact-v1',
        TemplateData: `{"sender":{"name":"${userProfile.name}","email":"${userProfile.email}"},"recipient":{"name":"there"},"inviteLink":"${INVITE_LINK}"}`
      })
    })
  })

  describe('already invited', () => {

    it('should not send out email when already invited', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say })
      await inviteContact(app, sendEmail)({ context, action, body, ack, say })
      expect(ack).to.be.calledTwice
      expect(say).to.be.calledTwice
      expect(sendEmail).to.be.calledOnce
    })
  })

  describe('already registered', () => {

    beforeEach(async () => {
      await store.user.registration.set(contactProfile.email, {})
    })

    it('should not send out email when already registered', async () => {
      await inviteContact(app, sendEmail)({ context, action, body, ack, say })
      expect(ack).to.be.called
      expect(say).to.be.called
      expect(sendEmail).to.not.be.called
    })
  })
})
