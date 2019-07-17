import {
  BLOCKED_MESSAGE,
  FAILED_TO_FORWARD_MESSAGE,
  FAILED_TO_FORWARD_THREAD_MESSAGE,
  forwardMessage, NOT_INSTALLED_MESSAGE
} from './forward-message'
import store from '../store'
import { MESSAGE_TYPES } from './message-types'
import { slackMessageId } from './map-dm'

describe('forwardMessage', () => {
  let app
  let delegateForwarding
  let openReverseChat
  let findMatchingMessage

  let delegate

  let params
  let message
  let say
  let context

  let stubbedForwardMessage

  const channelId = 'channel-id'
  const userId = 'user-id'
  const teamId = 'team-id'
  const userName = 'user-name'
  const userImage = 'user-image'
  const botId = 'user-bot-id'
  const userAccountId = 'user-account-id'

  const parentUserId = 'parent-user-id'

  const contactUserId = 'contact-user-id'
  const contactTeamId = 'contact-team-id'
  const contactChannelId = 'contact-channel-id'
  const contactBotToken = 'contact-bot-token'
  const contactUserToken = 'contact-user-token'
  const contactAccountId = 'contact-account-id'

  const threadTs = 'thread-ts'
  const contactThreadTs = 'contact-thread-ts'

  const userSlackGroup = {
    sourceAccountId: userAccountId,
    sinkAccountId: contactAccountId
  }

  const reverseLink = {
    teamId: contactTeamId,
    channelId: contactChannelId
  }

  const target = {
    username: userName,
    token: contactBotToken,
    channel: contactChannelId,
    icon_url: userImage,
    team: contactTeamId
  }

  beforeEach('prepare', () => {
    message = { channel: channelId, user: userId }
    context = { teamId, userId, botId, accountId: userAccountId }
    app = {}
    say = sandbox.fake()
    delegate = sandbox.fake()
    delegateForwarding = sandbox.fake.returns(delegate)
    openReverseChat = sandbox.fake.returns({ link: reverseLink })
    findMatchingMessage = sandbox.fake.returns({ ts: contactThreadTs })
    stubbedForwardMessage = forwardMessage(app, openReverseChat, delegateForwarding, findMatchingMessage)
    params = { message, say, context }
  })

  describe('without slack group', () => {
    it('should not forward the message', async () => {
      await stubbedForwardMessage(params)
      expect(delegate).to.not.be.called
    })
  })

  describe('with slack group', () => {
    beforeEach('add slack group, slack profile and contact slack team', () => {
      store.slack.conversation.set([teamId, channelId], userSlackGroup)
      store.slack.team.set(contactTeamId, { botToken: contactBotToken })
      store.account.profile.set(userAccountId, { name: userName, avatar: userImage })
      store.account.medium.set(contactAccountId, { teamId: contactTeamId, userId: contactUserId })
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
      params.context.accountId = 'other_user'
      await stubbedForwardMessage(params)
      expect(delegate).to.not.be.called
      expect(say).to.not.be.called
    })

    it('should not forward message when user is blocked', async () => {
      await store.account.blacklist.sadd(contactAccountId, [ userAccountId ])
      await forwardMessage(app, openReverseChat, delegateForwarding)(params)
      expect(say).to.be.calledOnceWith(BLOCKED_MESSAGE)
      expect(delegate).to.not.be.called
    })

    it('should not forward message when user uninstalled app', async () => {
      await store.account.medium.del(contactAccountId)
      await forwardMessage(app, openReverseChat, delegateForwarding)(params)
      expect(say).to.be.calledOnceWith(NOT_INSTALLED_MESSAGE)
      expect(delegate).to.not.be.called
    })

    describe('without reverse link', () => {
      it('should forward message and create reverse link', async () => {
        await stubbedForwardMessage(params)
        expect(openReverseChat).to.be.calledOnce
        expect(delegate).to.be.calledWith({ app, message, context, say, target })
      })
    })

    describe('with reverse link', () => {
      beforeEach('add reverse link', () => {
        store.account.link.set([contactAccountId, userAccountId], reverseLink)
      })

      it('should always assure a healthy reverse link', async () => {
        await stubbedForwardMessage(params)
        expect(openReverseChat).to.be.called
      })

      describe('standard message', () => {
        it('should forward message', async () => {
          await stubbedForwardMessage(params)
          expect(delegate).to.be.calledWith({ app, message, context, say, target })
        })
      })

      describe('change/delete message', () => {
        it('should forward message', async () => {
          params.context.userId = null
          params.message.previous_message = message
          await stubbedForwardMessage(params)
          expect(delegate).to.be.calledWith({ app, message, context, say, target })
        })
      })

      describe('thread meassage', () => {
        const threadMessageMappingId = slackMessageId(teamId, channelId, threadTs)

        beforeEach('add slack group and user', async () => {
          await store.mapping.dm.set(threadMessageMappingId, contactThreadTs)
          await store.slack.conversation.set([contactTeamId, contactChannelId], {
            source: { teamId: contactTeamId, userId: contactUserId }
          })
          await store.slack.user.set([contactTeamId, contactUserId], {
            userToken: contactUserToken
          })
        })

        it('should forward message with thread_ts', async () => {
          params.message.thread_ts = threadTs
          params.message.parent_user_id = parentUserId
          await stubbedForwardMessage(params)
          expect(delegate).to.be.calledWith({
            app,
            message,
            context,
            say,
            target: {
              ...target,
              thread_ts: contactThreadTs
            }
          })
        })

        it('should forward broadcast as message with reply_broadcast', async () => {
          params.message.thread_ts = threadTs
          params.message.subtype = MESSAGE_TYPES.thread_broadcast
          await stubbedForwardMessage(params)
          expect(delegate).to.be.calledWith({
            app,
            message,
            context,
            say,
            target: {
              ...target,
              thread_ts: contactThreadTs,
              reply_broadcast: true
            }
          })
        })

        it('should send a warning when matching message cannot be found', async () => {
          await store.mapping.dm.del(threadMessageMappingId)
          params.message.thread_ts = threadTs
          await stubbedForwardMessage(params)
          expect(say).to.be.calledOnceWith(FAILED_TO_FORWARD_THREAD_MESSAGE)
        })
      })

      it('should send a warning when delegation fails', async () => {
        delegateForwarding = sandbox.fake.returns(null)
        await forwardMessage(app, openReverseChat, delegateForwarding)(params)
        expect(delegate).to.not.be.called
        expect(say).to.be.calledOnceWith(FAILED_TO_FORWARD_MESSAGE)
      })

      it('should send a warning when forwarding fails', async () => {
        delegate = sandbox.fake.throws('error')
        delegateForwarding = sandbox.fake.returns(delegate)
        await forwardMessage(app, openReverseChat, delegateForwarding)(params)
        expect(delegate).to.be.calledOnce
        expect(say).to.be.calledOnceWith(FAILED_TO_FORWARD_MESSAGE)
      })
    })
  })
})
