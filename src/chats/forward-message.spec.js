import { FAILED_TO_FORWARD_MESSAGE, forwardMessage } from './forward-message'
import store from '../store'
import { MESSAGE_TYPES } from './message-types'

describe('forwardMessage', () => {
  let app
  let delegateForwarding
  let createReverseLink

  let delegate

  let params
  let message
  let say
  let context

  let stubbedForwardMessage

  const channelId = 'channel-id'
  const userId = 'user-id'
  const teamId = 'team-id'
  const userEmail = 'user-email'
  const userName = 'user-name'

  const contactUserId = 'contact-user-id'
  const contactTeamId = 'contact-team-id'
  const contactEmail = 'contact-email'
  const contactChannelId = 'contact-channel-id'
  const contactBotToken = 'contact-bot-token'

  const userSlackGroup = {
    source: { userId, teamId, email: userEmail },
    sink: { email: contactEmail }
  }

  const reverseLink = {
    teamId: contactTeamId,
    userId: contactUserId,
    channelId: contactChannelId
  }

  const target = {
    username: userName,
    token: contactBotToken,
    channel: contactChannelId
  }

  beforeEach('prepare', () => {
    message = { channel: channelId, user: userId }
    context = { teamId, userId }
    app = {}
    say = sandbox.fake()
    delegate = sandbox.fake()
    delegateForwarding = sandbox.fake.returns(delegate)
    createReverseLink = sandbox.fake.returns({ link: reverseLink })
    stubbedForwardMessage = forwardMessage(app, createReverseLink, delegateForwarding)
    params = { message, say, context }
  })

  describe('without slack group', () => {
    it('should not forward the message', async () => {
      await forwardMessage(app, delegateForwarding)(params)
      expect(delegate).to.not.be.called
    })
  })

  describe('with slack group', () => {
    beforeEach('add slack group, slack profile and contact slack team', () => {
      store.slack.group.set([teamId, channelId], userSlackGroup)
      store.slack.team.set(contactTeamId, { botToken: contactBotToken })
      store.slack.profile.set([teamId, userId], { name: userName })
    })

    it('should not forward message when subtype is ignored', async () => {
      params.message.subtype = MESSAGE_TYPES.bot_message
      await stubbedForwardMessage(params)
      expect(delegate).to.not.be.called
      expect(say).to.not.be.called
    })

    it('should not forward message when subtype is not supported and send warning', async () => {
      params.message.subtype = 'not_supported'
      await stubbedForwardMessage(params)
      expect(delegate).to.not.be.called
      expect(say).to.be.calledOnce
    })

    it('should not forward message when user is not linked', async () => {
      params.message.user = 'other_user'
      await stubbedForwardMessage(params)
      expect(delegate).to.not.be.called
      expect(say).to.not.be.called
    })

    describe('without reverse link', () => {
      it('should forward message and created reverse link', async () => {
        await stubbedForwardMessage(params)
        expect(createReverseLink).to.be.calledOnce
        expect(delegate).to.be.calledWith({ app, message, context, say, target })
      })
    })

    describe('with reverse link', () => {
      beforeEach('add reverse link', () => {
        store.link.set([contactEmail, userEmail], reverseLink)
      })

      it('should forward message and not create reverse link', async () => {
        await stubbedForwardMessage(params)
        expect(createReverseLink).to.not.be.called
        expect(delegate).to.be.calledWith({ app, message, context, say, target })
      })

      it('should send a warning when delegation fails', async () => {
        delegateForwarding = sandbox.fake.returns(null)
        await forwardMessage(app, createReverseLink, delegateForwarding)(params)
        expect(delegateForwarding).to.be.calledOnce
        expect(delegate).to.not.be.called
        expect(say).to.be.calledOnceWith(FAILED_TO_FORWARD_MESSAGE)
      })

      it('should send a warning when forwarding fails', async () => {
        delegate = sandbox.fake.throws('error')
        delegateForwarding = sandbox.fake.returns(delegate)
        await forwardMessage(app, createReverseLink, delegateForwarding)(params)
        expect(delegateForwarding).to.be.calledOnce
        expect(delegate).to.be.calledOnce
        expect(say).to.be.calledOnceWith(FAILED_TO_FORWARD_MESSAGE)
      })
    })
  })
})
