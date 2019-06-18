import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo,
  generateChannelName,
  generateNextCandidate,
  generateNextIterator,
  createSlackLink
} from './create-slack-link'
import store from '../store'

describe('chat', () => {
  describe('generateChannelName', () => {
    it('should replace one empty space', () => {
      const name = generateChannelName('x y')
      expect(name).to.eql('ul-x-y')
    })

    it('should replace various empty spaces', () => {
      const name = generateChannelName('x y z')
      expect(name).to.eql('ul-x-y-z')
    })

    it('should convert to lower case', () => {
      const name = generateChannelName('X')
      expect(name).to.eql('ul-x')
    })

    it('should shorten to 21 characters', () => {
      const name = generateChannelName('123456789012345678901234567890')
      expect(name).to.eql('ul-123456789012345678')
    })

    it('should apply everything in right order', () => {
      const name = generateChannelName('1 3 56789012345678901234567890')
      expect(name).to.eql('ul-1-3-56789012345678')
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

  describe('createSlackLink', () => {
    const teamId = 'current-team-id'
    const userId = 'current-user-id'
    const userEmail = 'current-user@x.com'
    const contactName = 'contact name'
    const contactEmail = 'contact@x.com'
    const contactUserId = 'contact-user-id'
    const contactTeamId = 'contact-team-id'
    const groupId = 'group-id'
    const groupName = 'group-name'
    const createdGroup = {
      id: groupId,
      name: groupName
    }
    const createdLink = {
      platform: 'slack',
      type: 'group',
      teamId: teamId,
      channelId: groupId
    }
    const existingGroupId = 'existing-group-id'
    const existingGroupName = 'existing-group-name'
    const existingGroup = {
      id: existingGroupId,
      name: existingGroupName
    }
    const existingLink = {
      platform: 'slack',
      type: 'group',
      teamId: teamId,
      channelId: existingGroupId
    }

    let app = { client: { conversations: {}, chat: {} } }
    let params

    beforeEach('prepare app', async () => {
      app.client.conversations.create = sandbox.stub()
      app.client.conversations.info = sandbox.fake.returns({
        channel: { id: existingGroupId, name: existingGroupName }
      })
      app.client.conversations.invite = sandbox.fake()
      await store.slack.profile.set([contactTeamId, contactUserId], {
        email: contactEmail,
        name: contactName
      })
    })

    beforeEach('prepare params', () => {
      params = {
        app,
        context: { botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id' },
        source: {
          platform: 'slack',
          userId: userId,
          teamId: teamId,
          email: userEmail
        },
        sink: {
          platform: 'slack',
          userId: contactUserId,
          teamId: contactTeamId,
          email: contactEmail
        }
      }
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
          link: createdLink
        })
      })

      it('should create a link when it does not exist yet', async () => {
        await createSlackLink(params)
        const link = await store.link.get([userEmail, contactEmail])
        expect(link).to.eql(createdLink)
      })

      it('should create a slack group when it does not exist yet', async () => {
        await createSlackLink(params)
        const createdGroup = await store.slack.group.get([teamId, groupId])
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

      it('should return existing link when link already exists', async () => {
        await store.link.set([userEmail, contactEmail], existingLink)
        await store.slack.group.set([teamId, existingGroupId], existingGroup)
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: true,
          link: existingLink
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
          link: createdLink
        })
      })

      it('should return created group when third call succeeds', async () => {
        app.client.conversations.create.onThirdCall().returns({ channel: { id: groupId, name: 'group-name' } })
        const result = await createSlackLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          link: createdLink
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
