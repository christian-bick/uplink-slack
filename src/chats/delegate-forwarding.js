import {
  forwardDeletion,
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText,
  forwardTextAsMe, forwardUpdate
} from './execute-forwarding'

import { MESSAGE_TYPES } from './message-types'

export const delegateForwarding = (message) => {
  if (message.files) {
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
  } else if (message.subtype === MESSAGE_TYPES.message_deleted) {
    return forwardDeletion
  } else if (message.subtype === MESSAGE_TYPES.message_changed) {
    return forwardUpdate
  } else if (message.subtype === MESSAGE_TYPES.me_message) {
    return forwardTextAsMe
  } else if (!message.subtype || message.subtype === MESSAGE_TYPES.thread_broadcast) {
    return forwardText
  } else {
    return null
  }
}
