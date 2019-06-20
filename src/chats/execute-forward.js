import uuid from 'uuid/v4'
import request from 'request'
import requestAsync from 'request-promise-native'
import { buildNotSupportedMessage } from './message-types'
import fs, { promises as fsAsync } from 'fs'

import { appLog } from '../logger'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

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
