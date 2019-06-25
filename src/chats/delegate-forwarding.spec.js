import { delegateForwarding } from './delegate-forwarding'
import { MESSAGE_TYPES } from './message-types'
import {
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText,
  forwardTextAsMe
} from './execute-forwarding'

describe('delegateForwarding', () => {
  let message

  beforeEach('prepare message', () => {
    message = {}
  })

  it('should delegate to forwardText for message without subtype', () => {
    const delegate = delegateForwarding(message)
    expect(delegate).to.equal(forwardText)
  })

  it('should delegate to forwardTextAsMe for message with subtype me_message', () => {
    message.subtype = MESSAGE_TYPES.me_message
    const delegate = delegateForwarding(message)
    expect(delegate).to.equal(forwardTextAsMe)
  })

  describe('for files', () => {
    beforeEach('set file meta data', () => {
      message.subtype = MESSAGE_TYPES.file_share
    })

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
  })
})
