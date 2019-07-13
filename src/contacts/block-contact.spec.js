import store from '../store'
import {blockContact} from "./block-contact"

describe('blockContact', () => {
  const userAccountId = 'user-account-id'
  const userToken = 'user-token'
  const contactAccountId = 'contact-account-id'

  const channelId = 'channel-id'

  let app
  let params

  beforeEach(async () => {
    app = { client: { conversations: { archive: sandbox.fake() } } }
    params = {
      context: { accountId: userAccountId, userToken },
      action: { value: contactAccountId },
      ack: sandbox.fake()
    }
    await store.account.contacts.sadd(userAccountId, contactAccountId)
  })

  it('should add contact to backlist and remove from contact list', async () => {
    await blockContact(app)(params)
    const isBlocked = await store.account.blacklist.sismember(userAccountId, contactAccountId)
    expect(isBlocked).to.equal(1)
    const contacts = await store.account.contacts.smembers(userAccountId)
    expect(contacts).to.not.include(contactAccountId)
  })

  describe('link exists', async () => {
    beforeEach(async () => {
      await store.account.link.set([userAccountId, contactAccountId], { channelId })
    })

    it('should archive existing group', async () => {
      await blockContact(app)(params)
      expect(app.client.conversations.archive).to.be.calledOnceWith({
        token: userToken,
        channel: channelId
      })
    })

    it('should not throw error when existing group was archived', async () => {
      const error = new Error()
      error.data = { error: 'is_archived' }
      app.client.conversations.archive = sandbox.fake.throws(error)
      await blockContact(app)(params)
    })

    it('should not throw error when existing group was deleted', async () => {
      const error = new Error()
      error.data = { error: 'channel_not_found' }
      app.client.conversations.archive = sandbox.fake.throws(error)
      await blockContact(app)(params)
    })
  })
})
