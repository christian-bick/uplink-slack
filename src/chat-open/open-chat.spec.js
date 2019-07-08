import {
  buildCannotConnectToYourselfMessage,
  buildContactNotFoundMessage,
  buildGroupAlreadyExistsMessage,
  buildGroupCreatedMessage, buildNotContactSelected,
  openChat
} from './open-chat'

import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo
} from './create-link'

import store from '../store/index'
import { BotError } from '../errors'

describe('openChat', () => {
  const teamId = 'current-team-id'
  const userId = 'current-user-id'
  const userEmail = 'current-user@x.com'
  const userName = 'user-name'
  const userAccountId = 'user-account-id'
  const contactAccountId = 'contact-account-id'
  const contactName = 'user name'
  const contactEmail = 'contact@x.com'
  const groupId = 'group-id'
  const userProfile = { email: userEmail, name: userName }

  const context = { teamId, userId }

  const existingGroupId = 'existing-group-id'
  const existingGroupName = 'existing-group-name'
  const existingLink = {
    platform: 'slack',
    channelId: existingGroupId
  }

  let app = { client: { users: { profile: {} }, conversations: {}, chat: {} } }
  let params

  beforeEach('prepare app', async () => {
    await store.account.profile.set(userAccountId, { name: userName })
    await store.registration.set(userEmail, { accountId: userAccountId })
    app.client.conversations.create = sandbox.stub()
    app.client.conversations.info = sandbox.fake.returns({
      channel: { id: existingGroupId, name: existingGroupName }
    })
    app.client.conversations.invite = sandbox.fake()
    app.client.chat.postMessage = sandbox.fake()
  })

  beforeEach('prepare params', () => {
    params = {
      body: { submission: { email: contactEmail } },
      context: { teamId, userId, botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id', accountId: userAccountId },
      ack: sandbox.fake(),
      say: sandbox.fake()
    }
  })

  describe('no contact selected', () => {
    it('should ack with error', async () => {
      params.body.submission.email = null
      await openChat(app)(params)
      expect(params.ack, 'ack').to.be.calledOnceWith({
        errors: [{
          name: 'email',
          error: buildNotContactSelected()
        }]
      })
    })
  })

  describe('current user is same as contact', () => {
    it('should reply with cannot-connect-to-yourself message', async () => {
      params.body.submission.email = userEmail
      await openChat(app)(params)
      expect(params.ack, 'ack').to.be.calledOnce
      expect(params.say, 'say').to.be.calledOnceWith(buildCannotConnectToYourselfMessage())
    })
  })

  describe('contact is not registered', () => {
    it('should reply with contact-not-found message', async () => {
      await openChat(app)(params)
      expect(params.ack, 'ack').to.be.calledOnce
      expect(params.say, 'say').to.be.calledOnceWith(buildContactNotFoundMessage(context, contactEmail))
    })
  })

  describe('contact is registered', () => {
    beforeEach('create registrations', async () => {
      await store.account.profile.set(contactAccountId, { name: contactName })
      await store.registration.set(contactEmail, { accountId: contactAccountId })
    })

    describe('group name available', () => {
      beforeEach('prepare conversations.create', () => {
        app.client.conversations.create.returns({ channel: { id: groupId, name: 'group-name' } })
      })

      it('should reply with group created message when group does not exist', async () => {
        await openChat(app)(params)
        expect(app.client.chat.postMessage).to.be.calledOnceWith({
          channel: groupId,
          text: buildGroupCreatedMessage(context, contactName),
          token: params.context.botToken
        })
      })

      it('should reply with group already exists message when group already exists', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        await openChat(app)(params)
        expect(app.client.chat.postMessage).to.be.calledOnceWith({
          channel: existingGroupId,
          text: buildGroupAlreadyExistsMessage(context, contactName),
          token: params.context.botToken
        })
      })
    })

    describe('error scenarios', () => {
      it('should reply with failure message when name is taken', async () => {
        app.client.conversations.create.throws({ data: { error: 'name_taken' } })
        await openChat(app)(params)
        const expectedMsg = BotError.buildMessage(buildFailedToFindFreeNameInfo(10), context)
        expect(params.say, 'say').to.be.calledOnceWith(expectedMsg)
      })

      it('should reply with failure message when slack request fails', async () => {
        app.client.conversations.create.throws(new Error('not_allowed'))
        await openChat(app)(params)
        const expectedMsg = BotError.buildMessage(buildCannotCreateGroupInfo('not_allowed'), context)
        expect(params.say, 'say').to.be.calledOnceWith(expectedMsg)
      })
    })
  })
})
