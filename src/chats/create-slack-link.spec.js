import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo,
  generateChatName,
  generateNextCandidate,
  generateNextIterator,
  createSlackLink
} from './create-slack-link'
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
    const teamId = 'current-team-id'
    const userId = 'current-user-id'
    const userEmail = 'current-user@x.com'
    const contactEmail = 'contact@x.com'
    const groupId = 'group-id'
    const groupName = 'group-name'
    const createdGroup = {
      id: groupId,
      name: groupName,
    }
    const existingGroupId = 'existing-group-id'
    const existingGroupName = 'existing-group-name'
    const existingGroup = {
      id: existingGroupId,
      name: existingGroupName
    }

    let app = { client: {conversations: {} } }
    let params

    beforeEach('prepare app', () => {
      app.client.conversations.create = sandbox.stub()
      app.client.conversations.info = sandbox.fake.returns({
        channel: { id: existingGroupId, name: existingGroupName }
      })
      app.client.conversations.invite = sandbox.fake()
    })

    beforeEach('prepare params', () => {
      params = {
        userEmail,
        contactEmail,
        context: { teamId: teamId, userId: userId, botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id' },
        app,
      }
    })

    beforeEach('create registration', async () => {
      await store.user.registration.setnx(contactEmail, {
        platform: 'slack',
        userId: 'contact-user-id',
        teamId: 'contact-team-id'
      })
    })

    describe('group name available', () => {
      beforeEach('prepare conversations.create', () => {
        app.client.conversations.create.returns({ channel: createdGroup })
      })

      it('should create a conversation and invite bot', async () => {
        await createSlackLink(params)
        expect(app.client.conversations.create).to.be.calledOnce
        expect(app.client.conversations.invite).to.be.calledOnceWith({
          token: params.context.userToken,
          channel: groupId,
          users: params.context.botId
        })
      })

      it('should return created group when group does not exist', async () => {
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          group: createdGroup,
        })
      })

      it('should create a slack link when it does not exist yet', async () => {
        await createSlackLink(params)
        const createdGroupId = await store.slackLink.get(userEmail, contactEmail)
        expect(createdGroupId).to.equal(groupId)
      })

      it('should create a slack group when it does not exist yet', async () => {
        await createSlackLink(params)
        const createdGroup = await store.slackGroup.get(groupId)
        expect(createdGroup).to.eql({
          source: {
            teamId: teamId,
            userId: userId,
            email: userEmail
          },
          sink: {
            email: contactEmail
          }
        })
      })

      it('should return existing group when group already exists', async () => {
        await store.slackLink.set(userEmail, contactEmail, existingGroupId)
        await store.slackGroup.set(existingGroupId, existingGroup)
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: true,
          group: existingGroup,
        })
      })
    })

    describe('group name taken', () => {
      beforeEach('prepare groups.create', () => {
        app.client.conversations.create.throws({ data: { error: 'name_taken' } })
      })

      it('should return created group when second call succeeds', async () => {
        app.client.conversations.create.onSecondCall().returns({ channel: { id: groupId, name: 'group-name' } })
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          group: createdGroup,
        })
      })

      it('should return created group when third call succeeds', async () => {
        app.client.conversations.create.onThirdCall().returns({ channel: { id: groupId, name: 'group-name' } })
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          group: createdGroup,
        })
      })

      it('should throw error when name is taken', async () => {
        await expect(createSlackLink(params)).to.be.rejectedWith(Error, buildFailedToFindFreeNameInfo(10))
      })
    })

    describe('error scenarios', () => {
      it('should throw error when slack request fails', async () => {
        app.client.conversations.create.throws(new Error('not_allowed'))
        await expect(createSlackLink(params)).to.be.rejectedWith(Error, buildCannotCreateGroupInfo(contactEmail, 'not_allowed'))
      })
    })
  })
})
