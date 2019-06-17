import fs, { promises as fsAsync } from 'fs'
import request from 'request'
import requestAsync from 'request-promise-native'
import uuid from 'uuid/v4'

import { createReverseSlackLink } from './create-slack-link'
import store from '../store'
import { appLog } from '../logger'

const forwardLog = appLog.child({ action: 'forwarding' })

export const buildNotSupportedMessage = (type) => {
  return `:warning: Forwarding ${type} is not supported at this point.`
}

export const FAILED_TO_FORWARD_FILE = ':warning: Failed to forward the last posted file'
export const FAILED_TO_FORWARD_MESSAGE = ':warning: Failed to forward the last posted message'

export const forwardMessage = (app) => async ({ context, message, say }) => {
  try {
    forwardLog.debug('Received message', { user: message.user || message.bot_id, channel: message.channel, subtype: message.subtype || 'none' })
    const channelId = message.channel
    const userSlackGroup = await store.slackGroup.get(channelId)
    if (!userSlackGroup) {
      forwardLog.debug('Skipping forwarding (not a linked group)')
      return
    }
    if (!message.user || message.user !== userSlackGroup.source.userId) {
      forwardLog.debug('Skipping forwarding (not a linked user)')
      return
    }
    const reverseLink = await store.link.get(userSlackGroup.sink.email, userSlackGroup.source.email)
    let contactSlackGroup
    if (reverseLink) {
      forwardLog.debug('Found reverse link', reverseLink)
      contactSlackGroup = await store.slackGroup.get(reverseLink.channelId)
    } else {
      forwardLog.debug('Creating reverse link', reverseLink)
      const { group } = await createReverseSlackLink({ app, sourceSlackGroup: userSlackGroup })
      contactSlackGroup = group
    }
    const contactTeam = await store.slackTeam.get(contactSlackGroup.source.teamId)
    const userProfile = await store.slackProfile.get(context.userId)
    const forwardContext = {
      username: userProfile.name || userProfile.email,
      token: contactTeam.botToken,
      channel: reverseLink.channelId
    }
    if (!message.subtype) {
      await forwardText({ app, forwardContext, text: message.text })
      forwardLog.debug('Forwarded text', { channelId: reverseLink.channelId })
    } else if (message.subtype === 'file_share') {
      await forwardFile({ app, forwardContext, files: message.files, say })
      forwardLog.debug('Forwarded file', { channelId: reverseLink.channelId })
    } else {
      forwardLog.debug('Skipping forwarding (unsupported message type)')
    }
  } catch (err) {
    appLog.error(FAILED_TO_FORWARD_MESSAGE, err)
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
    appLog.error(FAILED_TO_FORWARD_FILE, err)
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
  appLog.debug('Preparing temporary directory', { dir: tmpDir })
  await fsAsync.access(tmpDir, fs.constants.W_OK).catch(() => {
    appLog.debug('Creating temporary directory', { dir: tmpDir })
    return fsAsync.mkdir(tmpDir)
  })
  appLog.debug('Creating temporary file', { file: tmpFilePath })
  await fsAsync.open(tmpFilePath, 'w', 0o666)
  try {
    appLog.debug('Receiving file from Slack', { file: tmpFilePath })
    const writeStream = request.get(fileMeta.url_private, { auth: { bearer: forwardContext.token } }).pipe(fs.createWriteStream(tmpFilePath))
    appLog.debug('Received file from Slack', { url: fileMeta.url_private })
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    appLog.debug('Forwarding file to Slack', { url: fileMeta.url_private })
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
      appLog.debug('Removing temporary file', { file: tmpFilePath })
      await fsAsync.unlink(tmpFilePath)
    } catch (err) {
      appLog.error('Failed to remove temporary file', { err })
    }
  }
}
