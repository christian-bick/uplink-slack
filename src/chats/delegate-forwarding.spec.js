import { delegateForwarding, forwardFileList } from './delegate-forwarding'
import { MESSAGE_TYPES } from './message-types'
import {
  forwardDeletion,
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText,
  forwardTextAsMe, forwardUpdate
} from './execute-forwarding'

describe('delegateForwarding', () => {
  let message

  beforeEach('prepare message', () => {
    message = {}
  })

  describe('non files', () => {
    it('should delegate to forwardText for message without subtype', () => {
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardText)
    })

    it('should delegate to forwardText for message with subtype thread_broadcast ', () => {
      message.subtype = MESSAGE_TYPES.thread_broadcast
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardText)
    })

    it('should delegate to forwardTextAsMe for message with subtype me_message', () => {
      message.subtype = MESSAGE_TYPES.me_message
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardTextAsMe)
    })

    it('should delegate to forwardUpdate for message with subtype message_changed', () => {
      message.subtype = MESSAGE_TYPES.message_changed
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardUpdate)
    })

    it('should delegate to forwardDeletion for message with subtype message_deleted', () => {
      message.subtype = MESSAGE_TYPES.message_deleted
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardDeletion)
    })
  })

  describe('for files', () => {
    it('should delegate to forwardFileAsSnippet for mimetype=text/plain', () => {
      message.files = [{ mimetype: 'text/plain' }]
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardFileAsSnippet)
    })

    it('should delegate to forwardFileAsPost for mimetype=text/plain and filetype=space ', () => {
      message.files = [{ mimetype: 'text/plain', filetype: 'space' }]
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardFileAsPost)
    })

    it('should delegate to forwardFileAsMultipart for other mimetypes', () => {
      message.files = [{ mimetype: 'image/jpeg' }]
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardFileAsMultipart)
    })

    it('should delegate to forwardFileList for multiples files', () => {
      message.files = [{ mimetype: 'image/jpeg' }, { mimetype: 'image/jpeg' }]
      const delegate = delegateForwarding(message)
      expect(delegate).to.equal(forwardFileList)
    })
  })
})
