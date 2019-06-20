import fs, { promises as fsAsync } from 'fs'
import request from 'request'
import requestAsync from 'request-promise-native'
import uuid from 'uuid/v4'
import _ from 'lodash'

import { createReverseSlackLink } from './create-slack-link'
import store from '../store'
import { appLog } from '../logger'

export const buildNotSupportedMessage = (type) => {
  return `:warning: Forwarding ${type} is not supported at this point.`
}

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'
export const IGNORED_MESSAGE_SUBTYPES = [
  'bot_message', 'pinned_item', 'unpinned_item', 'ekm_access_denied',
  'channel_archive', 'channel_join', 'channel_leave', 'channel_name', 'channel_purpose', 'channel_topic', 'channel_unarchive',
  'group_archive', 'group_join', 'group_leave', 'group_name', 'group_purpose', 'group_topic', 'group_unarchive'
]
export const SUPPORTED_MESSAGE_SUBTYPES = {
  file_share: 'file_share'
}

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

export const forwardMessage = (app, forwardDispatcher = slackDispatcher) => async ({ context, message, say }) => {
  try {
    forwardLog.debug({ message }, 'received message')
    const channelId = message.channel
    const userSlackGroup = await store.slack.group.get([context.teamId, channelId])
    if (!userSlackGroup) {
      forwardLog.debug('skipping forwarding (not a linked group)')
      return
    }
    if (message.subtype && IGNORED_MESSAGE_SUBTYPES.includes(message.subtype)) {
      forwardLog.debug('skipping forwarding (ignored message subtype)')
      return
    }
    if (message.subtype && !SUPPORTED_MESSAGE_SUBTYPES[message.subtype]) {
      forwardLog.debug('skipping forwarding (not a supported message subtype)')
      say(buildNotSupportedMessage(message.subtype))
      return
    }
    if (!message.user || message.user !== userSlackGroup.source.userId) {
      forwardLog.debug('skipping forwarding (not a linked user)')
      return
    }
    let reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
    if (reverseLink) {
      forwardLog.debug({ reverseLink }, 'found reverse link')
    } else {
      forwardLog.debug({ reverseLink }, 'creating reverse link')
      const linkResult = await createReverseSlackLink({ app, sourceSlackGroup: userSlackGroup })
      reverseLink = linkResult.link
    }
    const contactTeam = await store.slack.team.get(reverseLink.teamId)
    const userProfile = await store.slack.profile.get([context.teamId, context.userId])
    const target = {
      username: userProfile.name || userProfile.email,
      token: contactTeam.botToken,
      channel: reverseLink.channelId
    }
    forwardLog.debug({ message, reverseLink }, 'attempting to forward message')
    const forwardDelegate = forwardDispatcher(message)
    if (forwardDelegate) {
      await forwardDelegate({ app, context, message, say, target })
      forwardLog.info({ message, reverseLink }, 'message forwarded')
    } else {
      forwardLog.error({ message }, 'a supported message subtype is missing implementation')
      say(FAILED_TO_FORWARD_MESSAGE)
    }
  } catch (err) {
    forwardLog.error({ err, message }, FAILED_TO_FORWARD_MESSAGE)
    say(FAILED_TO_FORWARD_MESSAGE)
  }
}

export const slackDispatcher = (message) => {
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

export const forwardText = async ({ app, target, message }) => {
  await app.client.chat.postMessage({
    ...target,
    text: message.text
  })
}

export const forwardFileAsPost = async ({ say }) => {
  say(buildNotSupportedMessage('posts'))
}

export const forwardFileAsSnippet = (fileMeta) => async ({ app, target }) => {
  const content = await requestAsync.get(fileMeta.url_private_download, { auth: { bearer: target.token } })
  await app.client.files.upload({
    token: target.token,
    channels: target.channel,
    filetype: fileMeta.filetype,
    title: fileMeta.title,
    content
  })
}

export const forwardFileAsMultipart = (fileMeta) => async ({ app, target }) => {
  const tmpDir = './tmp'
  const tmpFilePath = `${tmpDir}/${uuid()}-${fileMeta.name}`
  forwardLog.debug('Preparing temporary directory', { dir: tmpDir })
  await fsAsync.access(tmpDir, fs.constants.W_OK).catch(() => {
    forwardLog.debug('Creating temporary directory', { dir: tmpDir })
    return fsAsync.mkdir(tmpDir)
  })
  forwardLog.debug('Creating temporary file', { file: tmpFilePath })
  await fsAsync.open(tmpFilePath, 'w', 0o666)
  try {
    forwardLog.debug('Receiving file from Slack', { file: tmpFilePath })
    const writeStream = request.get(fileMeta.url_private, { auth: { bearer: target.token } }).pipe(fs.createWriteStream(tmpFilePath))
    forwardLog.debug('Received file from Slack', { url: fileMeta.url_private })
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    forwardLog.debug('Forwarding file to Slack', { url: fileMeta.url_private })
    await app.client.files.upload({
      token: target.token,
      channels: target.channel,
      filetype: fileMeta.filetype,
      title: fileMeta.title,
      file: fs.createReadStream(tmpFilePath)
    })
  } catch (err) {
    throw err
  } finally {
    try {
      forwardLog.debug('Removing temporary file', { file: tmpFilePath })
      await fsAsync.unlink(tmpFilePath)
    } catch (err) {
      forwardLog.error({ err }, 'Failed to remove temporary file')
    }
  }
}
