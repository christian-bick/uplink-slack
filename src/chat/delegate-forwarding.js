import {
  forwardDeletion,
  forwardFileAsMultipart,
  forwardFileAsPost,
  forwardFileAsSnippet,
  forwardText,
  forwardTextAsMe, forwardUpdate
} from './execute-forwarding'

import { MESSAGE_TYPES } from './message-types'

export const delegateForwardForFile = (file) => {
  if (file.mimetype === 'text/plain') {
    return forwardFileAsSnippet
  } else if (file.mimetype === 'application/vnd.slack-docs') {
    // FIXME: This is broken after Slack changed something with posts
    return forwardFileAsPost
  } else {
    return forwardFileAsMultipart
  }
}

export const forwardFileList = async (params) => {
  const { message } = params
  const forwardFiles = message.files.map((file, index) => delegateForwardForFile(file)(params, index))
  await Promise.all(forwardFiles)
}

export const delegateForwarding = (message) => {
  if (message.files) {
    if (message.files.length === 1) {
      return delegateForwardForFile(message.files[0])
    } else {
      return forwardFileList
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
