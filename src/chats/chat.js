import fs, { promises as fsAsync } from 'fs'
import request from 'request'
import requestAsync from 'request-promise-native'
import uuid from 'uuid/v4'
import _ from 'lodash'

import { createReverseSlackLink } from './create-slack-link'
import store from '../store'
import { appLog } from '../logger'

const forwardLog = appLog.child({ action: 'forwarding' })

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
  file_share: 'file_share',
}

export const forwardMessage = (app) => async ({ context, message, say }) => {
  try {
    forwardLog.debug('Received message', { message: _.pick(message, 'user', 'bot_id', 'subtype', 'channel') })
    const channelId = message.channel
    const userSlackGroup = await store.slack.group.get([context.teamId, channelId])
    if (!userSlackGroup) {
      forwardLog.debug('Skipping forwarding (not a linked group)', { channelId: channelId })
      return
    }
    if (message.subtype && IGNORED_MESSAGE_SUBTYPES.includes(message.subtype)) {
      forwardLog.debug('Skipping forwarding (ignored message subtype)', { subtype: message.subtype })
      return
    }
    if (message.subtype && !SUPPORTED_MESSAGE_SUBTYPES[message.subtype]) {
      forwardLog.debug('Skipping forwarding (not a supported message subtype)', { subtype: message.subtype })
      say(buildNotSupportedMessage(message.subtype))
      return
    }
    if (!message.user || message.user !== userSlackGroup.source.userId) {
      forwardLog.debug('Skipping forwarding (not a linked user)', { userId: message.user || message.bot_id })
      return
    }
    let reverseLink = await store.link.get([userSlackGroup.sink.email, userSlackGroup.source.email])
    if (reverseLink) {
      forwardLog.debug('Found reverse link', reverseLink)
    } else {
      forwardLog.debug('Creating reverse link', reverseLink)
      const linkResult = await createReverseSlackLink({ app, sourceSlackGroup: userSlackGroup })
      reverseLink = linkResult.link
    }
    const contactTeam = await store.slack.team.get(reverseLink.teamId)
    const userProfile = await store.slack.profile.get([context.teamId, context.userId])
    const forwardContext = {
      username: userProfile.name || userProfile.email,
      token: contactTeam.botToken,
      channel: reverseLink.channelId
    }
    forwardLog.debug('Attempting to forward message', message)
    if (!message.subtype) {
      await forwardText({ app, forwardContext, text: message.text })
      forwardLog.debug('Forwarded text', { ts: message.ts })
    } else if (message.subtype === SUPPORTED_MESSAGE_SUBTYPES.file_share) {
      await forwardFile({ app, forwardContext, files: message.files, say })
      forwardLog.debug('Forwarded file', { ts: message.ts })
    } else {
      forwardLog.error('A supported message subtype is missing implementation', { subtype: message.subtype })
    }
  } catch (err) {
    forwardLog.error(FAILED_TO_FORWARD_MESSAGE, err)
    say(FAILED_TO_FORWARD_MESSAGE)
  }
}

export const forwardText = async ({ app, forwardContext, text }) => {
  return app.client.chat.postMessage({
    ...forwardContext,
    text
  })
}

export const forwardFile = async ({ app, forwardContext, files, say }) => {
  try {
    const fileMeta = files[0]
    if (fileMeta.mimetype === 'text/plain') {
      if (fileMeta.filetype === 'space') {
        say(buildNotSupportedMessage('posts'))
      } else {
        await forwardFileAsContent({ app, forwardContext, fileMeta })
      }
    } else {
      await forwardFileAsMultipart({ app, forwardContext, fileMeta })
    }
  } catch (err) {
    forwardLog.error(FAILED_TO_FORWARD_FILE, err)
    say(FAILED_TO_FORWARD_FILE)
  }
}

export const forwardFileAsContent = async ({ app, forwardContext, fileMeta }) => {
  const content = await requestAsync.get(fileMeta.url_private_download, { auth: { bearer: forwardContext.token } })
  return app.client.files.upload({
    token: forwardContext.token,
    channels: forwardContext.channel,
    filetype: fileMeta.filetype,
    title: fileMeta.title,
    content
  })
}

export const forwardFileAsMultipart = async ({ app, forwardContext, fileMeta }) => {
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
    const writeStream = request.get(fileMeta.url_private, { auth: { bearer: forwardContext.token } }).pipe(fs.createWriteStream(tmpFilePath))
    forwardLog.debug('Received file from Slack', { url: fileMeta.url_private })
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    forwardLog.debug('Forwarding file to Slack', { url: fileMeta.url_private })
    await app.client.files.upload({
      token: forwardContext.token,
      channels: forwardContext.channel,
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
      forwardLog.error('Failed to remove temporary file', { err })
    }
  }
}
