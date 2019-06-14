import {
  buildCannotConnectToYourselfMessage,
  buildContactNotFoundMessage,
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo,
  buildGroupAlreadyExistsMessage,
  buildGroupCreatedMessage,
  generateChatName,
  generateNextCandidate,
  generateNextIterator,
  openChat
} from './open-chat'
import store from '../store'

describe('chat', () => {
  describe('generateChatName', () => {
    it('should remove host part', () => {
      const name = generateChatName('x@y.com')
      expect(name).to.eql('x')
    })

    it('should replace dots and lower dashes with hyphens', () => {
      const name = generateChatName('x.y_z')
      expect(name).to.eql('x-y-z')
    })

    it('should shorten to 21 characters', () => {
      const name = generateChatName('123456789012345678901234567890')
      expect(name).to.eql('123456789012345678901')
    })

    it('should apply everything in right order', () => {
      const name = generateChatName('1.3_56789012345678901234567890@abcdefg.com')
      expect(name).to.eql('1-3-56789012345678901')
    })
  })

  describe('generateNextIterator', () => {
    it('should return an integer between 100 (incl) and 1000 (excl)', () => {
      const iterator = generateNextIterator()
      expect(iterator).to.be.above(99)
      expect(iterator).to.be.below(1000)
      expect(iterator).to.satisfy(Number.isInteger)
    })
  })

  describe('generateNextCandidate', () => {
    it('should append no iterator on first attempt', () => {
      const next = generateNextCandidate('x', 0)
      expect(next).to.equal('x')
    })

    it('should append an iterator on any attempt but first', () => {
      const next = generateNextCandidate('x', 1)
      expect(next).matches(/x-[0-9]{3}/)
    })

    it('should trim long name to 17 characters before appending iterator', () => {
      const next = generateNextCandidate('12345678901234567890', 1)
      expect(next).matches(/12345678901234567-[0-9]{3}/)
    })
  })

  describe('openChat', () => {
    const currentTeamId = 'current-team-id'
    const currentUserId = 'current-user-id'
    const currentUserEmail = 'current-user@x.com'
    const contactEmail = 'contact@x.com'
    const groupId = 'group-id'
    const groupName = 'group-name'
    const existingGroupId = 'existing-group-id'
    const existingGroupName = 'existing-group-name'

    let app = { client: { users: { profile: {}}, conversations: {} } }
    let params

    beforeEach('prepare app', () => {
      app.client.users.profile.get = sandbox.fake.returns({
        profile: { email: currentUserEmail }
      })
      app.client.conversations.create = sandbox.stub()
      app.client.conversations.info = sandbox.fake.returns({
        channel: { id: existingGroupId, name: existingGroupName }
      })
      app.client.conversations.invite = sandbox.fake()
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

    describe('contact not registered', () => {
      it('should reply with contact-not-found message', async () => {
        await openChat(app)(params)
        expect(params.ack, 'ack').to.be.calledOnce
        expect(params.say, 'say').to.be.calledOnceWith(buildContactNotFoundMessage(contactEmail))
      })
    })

    describe('contact registered', () => {
      beforeEach('create registration', async () => {
        await store.user.registration.setnx(contactEmail, {
          platform: 'slack',
          userId: 'contact-user-id',
          teamId: 'contact-team-id'
        })
      })

      describe('group name available', () => {
        beforeEach('prepare conversations.create', () => {
          app.client.conversations.create.returns({ channel: { id: groupId, name: 'group-name' } })
        })

        it('should create a conversation and invite bot', async () => {
          await openChat(app)(params)
          expect(app.client.conversations.create).to.be.calledOnce
          expect(app.client.conversations.invite).to.be.calledOnceWith({
            token: params.context.userToken,
            channel: groupId,
            users: params.context.botId
          })
        })

        it('should reply with group created message when group does not exist', async () => {
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupCreatedMessage(contactEmail, groupName))
        })

        it('should create a slack link when it does not exist yet', async () => {
          await openChat(app)(params)
          const createdGroupId = await store.slackLink.get(currentUserEmail, contactEmail)
          expect(createdGroupId).to.equal(groupId)
        })

        it('should create a slack group when it does not exist yet', async () => {
          await openChat(app)(params)
          const createdGroup = await store.slackGroup.get(groupId)
          expect(createdGroup).to.eql({
            source: {
              teamId: currentTeamId,
              userId: currentUserId,
              email: currentUserEmail,
            },
            sink: {
              email: contactEmail,
            },
          })
        })

        it('should reply with group already exists message when group already exists', async () => {
          await store.slackLink.set(currentUserEmail, contactEmail, groupId)
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupAlreadyExistsMessage(contactEmail, existingGroupName))
        })
      })

      describe('group name taken', () => {
        beforeEach('prepare groups.create', () => {
          app.client.conversations.create.throws({ data: { error: 'name_taken' } })
        })

        it('should reply with group created message when second call succeeds', async () => {
          app.client.conversations.create.onSecondCall().returns({ channel: { id: groupId, name: 'group-name' } })
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupCreatedMessage(contactEmail, groupName))
        })

        it('should reply with group created message when third call succeeds', async () => {
          app.client.conversations.create.onThirdCall().returns({ channel: { id: groupId, name: 'group-name' } })
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildGroupCreatedMessage(contactEmail, groupName))
        })

        it('should reply with failure message when name is taken', async () => {
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildFailedToFindFreeNameInfo(10))
        })
      })

      describe('error scenarios', () => {
        it('should reply with failure message when slack request fails', async () => {
          app.client.conversations.create.throws(new Error('not_allowed'))
          await openChat(app)(params)
          expect(params.say, 'say').to.be.calledOnceWith(buildCannotCreateGroupInfo(contactEmail, 'not_allowed'))
        })
      })
    })
  })
})
