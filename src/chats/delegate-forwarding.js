import {
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText,
  forwardTextAsMe
} from './execute-forwarding'

import { MESSAGE_TYPES } from './message-types'

export const delegateForwarding = (message) => {
  if (!message.subtype) {
    return forwardText
  } else if (message.subtype === MESSAGE_TYPES.me_message) {
    return forwardTextAsMe
  } else if (message.subtype === MESSAGE_TYPES.file_share) {
    const fileMeta = message.files[0]
    if (fileMeta.mimetype === 'text/plain') {
      if (fileMeta.filetype === 'space') {
        return forwardFileAsPost
      } else {
        return forwardFileAsSnippet
      }
    } else {
      return forwardFileAsMultipart
    }
  } else {
    return null
  }
}
