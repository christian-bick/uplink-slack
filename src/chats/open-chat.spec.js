import {
  buildCannotConnectToYourselfMessage,
  buildContactNotFoundMessage,
  buildGroupAlreadyExistsMessage,
  buildGroupCreatedMessage, buildRegistrationNotFoundMessage,
  openChat
} from './open-chat'

import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo,
} from './create-slack-link'

import store from '../store'

describe('chat', () => {
  describe('openChat', () => {
    const currentTeamId = 'current-team-id'
    const currentUserId = 'current-user-id'
    const currentUserEmail = 'current-user@x.com'
    const contactEmail = 'contact@x.com'
    const contactUserId = 'contact-user-id'
    const contactTeamId = 'contact-team-id'
    const groupId = 'group-id'
    const groupName = 'group-name'
    const existingGroupId = 'existing-group-id'
    const existingGroupName = 'existing-group-name'

    let app = { client: { users: { profile: {}}, conversations: {}, chat: {} } }
    let params

    beforeEach('prepare app', async () => {
      await store.slackUser.set(currentUserId, { email: currentUserEmail } )
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
        context: { teamId: currentTeamId, userId: currentUserId, botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id' },
        ack: sandbox.fake(),
        say: sandbox.fake()
      }
    })

    describe('current user is same as contact', () => {
      it('should reply with cannot-connect-to-yourself message', async () => {
        params.body.submission.email = currentUserEmail
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildCannotConnectToYourselfMessage(params.body.submission.email))
      })
    })

    describe('current user is not registered', () => {
      it('should reply with contact-not-found message', async () => {
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildRegistrationNotFoundMessage(contactEmail))
      })
    })

    describe('current user is registered', () => {
      beforeEach('create current user registration', async () => {
        await store.user.registration.set(currentUserEmail, {
          platform: 'slack',
          userId: currentUserId,
          teamId: currentTeamId,
          email: currentUserEmail,
        })
      })
      it('should reply with contact-not-found message', async () => {
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildContactNotFoundMessage(contactEmail))
      })
    })

    describe('current user and contact are registered', () => {
      beforeEach('create registrations', async () => {
        await store.user.registration.set(currentUserEmail, {
          platform: 'slack',
          userId: currentUserId,
          teamId: currentTeamId,
          email: currentUserEmail,
        })
        await store.user.registration.set(contactEmail, {
          platform: 'slack',
          userId: contactUserId,
          teamId: contactTeamId,
          email: contactEmail
        })
      })

      describe('group name available', () => {
        beforeEach('prepare conversations.create', () => {
          app.client.conversations.create.returns({ channel: { id: groupId, name: 'group-name' } })
        })

        it('should reply with group created message when group does not exist', async () => {
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupCreatedMessage(contactEmail, groupName))
        })

        it('should reply with group already exists message when group already exists', async () => {
          await store.link.set(currentUserEmail, contactEmail, groupId)
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupAlreadyExistsMessage(contactEmail, existingGroupName))
        })
      })

      describe('error scenarios', () => {
        it('should reply with failure message when name is taken', async () => {
          app.client.conversations.create.throws({ data: { error: 'name_taken' } })
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildFailedToFindFreeNameInfo(10))
        })

        it('should reply with failure message when slack request fails', async () => {
          app.client.conversations.create.throws(new Error('not_allowed'))
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildCannotCreateGroupInfo(contactEmail, 'not_allowed'))
        })
      })
    })
  })
})
