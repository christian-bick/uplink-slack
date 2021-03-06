import {
  buildCannotCreateGroupInfo,
  buildFailedToFindFreeNameInfo,
  generateChannelName,
  generateNextCandidate,
  generateNextIterator,
  createLink
} from './create-link'
import store from '../store/index'

describe('create-link', () => {
  describe('generateChannelName', () => {
    it('should replace one empty space', () => {
      const name = generateChannelName('x y')
      expect(name).to.eql('dm-x-y')
    })

    it('should replace various empty spaces', () => {
      const name = generateChannelName('x y z')
      expect(name).to.eql('dm-x-y-z')
    })

    it('should convert to lower case', () => {
      const name = generateChannelName('X')
      expect(name).to.eql('dm-x')
    })

    it('should shorten to 21 characters', () => {
      const name = generateChannelName('123456789012345678901234567890')
      expect(name).to.eql('dm-123456789012345678')
    })

    it('should apply everything in right order', () => {
      const name = generateChannelName('1 3 56789012345678901234567890')
      expect(name).to.eql('dm-1-3-56789012345678')
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

  describe('createLink', () => {
    const teamId = 'current-team-id'
    const userEmail = 'current-user@x.com'
    const userAccountId = 'user-account-id'
    const contactName = 'contact name'
    const contactEmail = 'contact@x.com'
    const contactAccountId = 'contact-account-id'
    const groupId = 'group-id'
    const groupName = 'group-name'
    const createdGroup = {
      id: groupId,
      name: groupName
    }
    const createdLink = {
      platform: 'slack',
      teamId,
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
      teamId,
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
      app.client.conversations.unarchive = sandbox.fake()
      await store.account.profile.set(contactAccountId, {
        name: contactName
      })
    })

    beforeEach('prepare params', () => {
      params = {
        app,
        context: { botToken: 'bot-token', userToken: 'user-token', botId: 'bot-id', teamId },
        sourceAccountId: userAccountId,
        sinkAccountId: contactAccountId
      }
    })

    describe('group name available', () => {
      beforeEach('prepare conversations.create', () => {
        app.client.conversations.create.returns({ channel: createdGroup })
      })

      it('should create a conversation and invite bot', async () => {
        await createLink(params)
        expect(app.client.conversations.create).to.be.calledOnce
        expect(app.client.conversations.invite).to.be.calledOnceWith({
          token: params.context.userToken,
          channel: groupId,
          users: params.context.botId
        })
      })

      it('should return created group when group does not exist', async () => {
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          link: createdLink
        })
      })

      it('should create a link when it does not exist yet', async () => {
        await createLink(params)
        const link = await store.account.link.get([userAccountId, contactAccountId])
        expect(link).to.eql(createdLink)
      })

      it('should create a slack group when link does not exist yet', async () => {
        await createLink(params)
        const createdGroup = await store.slack.conversation.get([teamId, groupId])
        expect(createdGroup).to.eql({
          mode: 'direct-message',
          sourceAccountId: userAccountId,
          sinkAccountId: contactAccountId
        })
      })

      it('should return existing link when link and group already exist', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        await store.slack.conversation.set([teamId, existingGroupId], existingGroup)
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: true,
          link: existingLink
        })
      })

      it('should return a new link and group when link exists but group does not', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        app.client.conversations.info = sandbox.fake.returns(null)
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          link: createdLink
        })
      })

      it('should create a new slack group when link exists but group does not', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        app.client.conversations.info = sandbox.fake.returns(null)
        await createLink(params)
        const createdGroup = await store.slack.conversation.get([teamId, groupId])
        expect(createdGroup).to.eql({
          mode: 'direct-message',
          sourceAccountId: userAccountId,
          sinkAccountId: contactAccountId
        })
      })

      it('should unarchive group when when link exists and group is archived ', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        app.client.conversations.info = sandbox.fake.returns({ channel: { is_archived: true } })
        await createLink(params)
        expect(app.client.conversations.unarchive).to.be.calledOnce
      })

      it('should return existing link when link exsists and group is archived ', async () => {
        await store.account.link.set([userAccountId, contactAccountId], existingLink)
        app.client.conversations.info = sandbox.fake.returns({ channel: { is_archived: true } })
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: true,
          link: existingLink
        })
      })

      it('should add a contact entry to empty contacts', async () => {
        await createLink(params)
        const contacts = await store.account.contacts.smembers(userAccountId)
        expect(contacts).to.contain(contactAccountId)
      })

      it('should not create a duplicate contact entry when contact already exists', async () => {
        await store.account.contacts.sadd(userAccountId, [ contactAccountId ])
        await createLink(params)
        const contacts = await store.account.contacts.smembers(userAccountId)
        expect(contacts).to.have.lengthOf(1)
      })

      it('should add a contact entry to existing contacts', async () => {
        const existingAccountId = 'some-other-account-id'
        await store.account.contacts.sadd(userAccountId, [ existingAccountId ])
        await createLink(params)
        const contacts = await store.account.contacts.smembers(userAccountId)
        expect(contacts).to.contain(contactAccountId)
        expect(contacts).to.contain(existingAccountId)
      })
    })

    describe('group name taken', () => {
      beforeEach('prepare groups.create', () => {
        app.client.conversations.create.throws({ data: { error: 'name_taken' } })
      })

      it('should return created group when second call succeeds', async () => {
        app.client.conversations.create.onSecondCall().returns({ channel: { id: groupId, name: 'group-name' } })
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          link: createdLink
        })
      })

      it('should return created group when third call succeeds', async () => {
        app.client.conversations.create.onThirdCall().returns({ channel: { id: groupId, name: 'group-name' } })
        const result = await createLink(params)
        expect(result).to.eql({
          alreadyExisted: false,
          link: createdLink
        })
      })

      it('should throw error when name is taken', async () => {
        await expect(createLink(params)).to.be.rejectedWith(Error, buildFailedToFindFreeNameInfo(10))
      })
    })

    describe('error scenarios', () => {
      it('should throw error when slack request fails', async () => {
        app.client.conversations.create.throws(new Error('not_allowed'))
        await expect(createLink(params)).to.be.rejectedWith(Error, buildCannotCreateGroupInfo('not_allowed'))
      })
    })
  })
})
