import {
  buildCannotConnectToYourselfMessage,
  buildContactNotFoundMessage,
  buildGroupAlreadyExistsMessage,
  buildGroupCreatedMessage, buildRegistrationNotFoundMessage,
  openChat
} from './open-chat'

import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo
} from './create-link'

import store from '../store/index'

describe('chat', () => {
  describe('openChat', () => {
    const teamId = 'current-team-id'
    const userId = 'current-user-id'
    const userEmail = 'current-user@x.com'
    const userName = 'user-name'
    const contactName = 'user name'
    const contactEmail = 'contact@x.com'
    const contactUserId = 'contact-user-id'
    const contactTeamId = 'contact-team-id'
    const groupId = 'group-id'
    const userProfile = { email: userEmail, name: userName }

    const existingGroupId = 'existing-group-id'
    const existingGroupName = 'existing-group-name'
    const existingLink = {
      platform: 'slack',
      type: 'group',
      teamId: teamId,
      channelId: existingGroupId
    }

    let app = { client: { users: { profile: {} }, conversations: {}, chat: {} } }
    let params

    beforeEach('prepare app', async () => {
      await store.slack.profile.set([teamId, userId], userProfile)
      app.client.conversations.create = sandbox.stub()
      app.client.conversations.info = sandbox.fake.returns({
        channel: { id: existingGroupId, name: existingGroupName }
      })
      app.client.conversations.invite = sandbox.fake()
      app.client.chat.postMessage = sandbox.fake()
      await store.slack.profile.set([contactTeamId, contactUserId], {
        email: contactEmail,
        name: contactName
      })
    })

    beforeEach('prepare params', () => {
      params = {
        body: { submission: { email: contactEmail } },
        context: { teamId: teamId, userId: userId, botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id' },
        ack: sandbox.fake(),
        say: sandbox.fake()
      }
    })

    describe('current user is same as contact', () => {
      it('should reply with cannot-connect-to-yourself message', async () => {
        params.body.submission.email = userEmail
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildCannotConnectToYourselfMessage(params.body.submission.email))
      })
    })

    describe('current user is not registered', () => {
      it('should reply with contact-not-found message', async () => {
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildRegistrationNotFoundMessage(teamId))
      })
    })

    describe('current user is registered', () => {
      beforeEach('create current user registration', async () => {
        await store.user.registration.set(userEmail, {
          platform: 'slack',
          userId: userId,
          teamId: teamId,
          email: userEmail
        })
      })
      it('should reply with contact-not-found message', async () => {
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildContactNotFoundMessage(contactEmail, userProfile))
      })
    })

    describe('current user and contact are registered', () => {
      beforeEach('create registrations', async () => {
        await store.user.registration.set(userEmail, {
          platform: 'slack',
          userId: userId,
          teamId: teamId,
          email: userEmail
        })
        await store.user.registration.set(contactEmail, {
          platform: 'slack',
          userId: contactUserId,
          teamId: contactTeamId,
          email: contactEmail
        })
      })

      it('should add a contact entry to empty contacts', async () => {
        await openChat(app)(params)
        const contacts = await store.user.contacts.smembers(userEmail)
        expect(contacts).to.contain(contactEmail)
      })

      it('should not create a duplicate contact entry when contact already exists', async () => {
        await store.user.contacts.sadd(userEmail, [ contactEmail ])
        await openChat(app)(params)
        const contacts = await store.user.contacts.smembers(userEmail)
        expect(contacts).to.have.lengthOf(1)
      })

      it('should add a contact entry to existing contacts', async () => {
        const existingEmail = 'existing-email'
        await store.user.contacts.sadd(userEmail, [ existingEmail ])
        await openChat(app)(params)
        const contacts = await store.user.contacts.smembers(userEmail)
        expect(contacts).to.contain(contactEmail)
        expect(contacts).to.contain(existingEmail)
      })

      describe('group name available', () => {
        beforeEach('prepare conversations.create', () => {
          app.client.conversations.create.returns({ channel: { id: groupId, name: 'group-name' } })
        })

        it('should reply with group created message when group does not exist', async () => {
          await openChat(app)(params)
          expect(app.client.chat.postMessage).to.be.calledOnceWith({
            channel: groupId,
            text: buildGroupCreatedMessage(userId, contactEmail),
            token: params.context.botToken
          })
        })

        it('should reply with group already exists message when group already exists', async () => {
          await store.link.set([userEmail, contactEmail], existingLink)
          await openChat(app)(params)
          expect(app.client.chat.postMessage).to.be.calledOnceWith({
            channel: existingGroupId,
            text: buildGroupAlreadyExistsMessage(userId, contactEmail),
            token: params.context.botToken
          })
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
