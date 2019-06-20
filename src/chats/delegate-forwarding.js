import {
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText
} from './execute-forwarding'

import { SUPPORTED_MESSAGE_SUBTYPES } from './message-types'

export const delegateForwarding = (message) => {
  if (!message.subtype) {
    return forwardText
  } else if (message.subtype === SUPPORTED_MESSAGE_SUBTYPES.file_share) {
    const fileMeta = message.files[0]
    if (fileMeta.mimetype === 'text/plain') {
      if (fileMeta.filetype === 'space') {
        return forwardFileAsPost
      } else {
        return forwardFileAsSnippet(fileMeta)
      }
    } else {
      return forwardFileAsMultipart(fileMeta)
    }
  } else {
    return null
  }
}
