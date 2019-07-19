/* eslint-disable camelcase */
import uuid from 'uuid/v4'
import request from 'request'
import requestAsync from 'request-promise-native'
import fs, { promises as fsAsync } from 'fs'

import { appLog } from '../logger'
import { mapMessage, getMappedMessageTs, mapFile, removeMessageMapping } from './map-dm'

const forwardLog = appLog.child({ module: 'chat', action: 'forward-message' })

export const buildFile = ({ message, target, fileMeta, data }) => {
  const augmentedFile = {
    filetype: fileMeta.filetype,
    title: fileMeta.title,
    token: target.token,
    channels: target.channel,
    ...data
  }
  if (message.text) {
    augmentedFile.initial_comment = message.text
  }
  if (target.thread_ts) {
    augmentedFile.thread_ts = target.thread_ts
  }
  return augmentedFile
}

export const forwardText = async ({ app, target, message: original }) => {
  const { ts } = await app.client.chat.postMessage({
    ...target,
    text: original.text
  })
  return mapMessage(original, { ...target, ts })
}

export const forwardTextAsMe = async ({ app, target, message: original }) => {
  const { ts } = await app.client.chat.postMessage({
    ...target,
    text: `_${original.text}_`
  })
  return mapMessage(original, { ...target, ts })
}

export const forwardUpdate = async ({ app, target, message }) => {
  const previous = message.previous_message
  const mappedMessageTs = await getMappedMessageTs(previous.team, message.channel, previous.ts)

  await app.client.chat.update({
    ...target,
    text: message.message.text,
    ts: mappedMessageTs
  })
}

export const forwardDeletion = async ({ app, target, message }) => {
  const previous = message.previous_message
  const mappedMessageTs = await getMappedMessageTs(previous.team, message.channel, previous.ts)

  await app.client.chat.delete({
    ...target,
    ts: mappedMessageTs
  })
  return removeMessageMapping({ ...message, ...previous }, { ...target, ts: mappedMessageTs })
}

export const forwardFileAsPost = async ({ app, message, context, target }, index = 0) => {
  const file = message.files[index]
  const content = await requestAsync.get(file.url_private, { auth: { bearer: context.botToken } })
  const forwardedContent = content && content !== '' ? JSON.parse(content) : { full: '', preview: '' }
  const data = { content: forwardedContent }
  const fileToUpload = buildFile({ message, target, fileMeta: file, data })
  const { file: forwardedFile } = await app.client.files.upload(fileToUpload)
  return mapFileWithMessage({ context, target, file, message, forwardedFile })
}

export const forwardFileAsSnippet = async ({ app, context, target, message }, index = 0) => {
  const file = message.files[index]
  const content = await requestAsync.get(file.url_private, { auth: { bearer: context.botToken } })
  const data = { content }
  const fileToUpload = buildFile({ message, target, fileMeta: file, data })
  const { file: forwardedFile } = await app.client.files.upload(fileToUpload)
  return mapFileWithMessage({ context, target, file, message, forwardedFile })
}

export const forwardFileAsMultipart = async ({ app, context, target, message: message }, index = 0) => {
  const file = message.files[index]
  const tmpDir = './tmp'
  const tmpFilePath = `${tmpDir}/${uuid()}-${file.name}`
  forwardLog.debug('Preparing temporary directory', { dir: tmpDir })
  await fsAsync.access(tmpDir, fs.constants.W_OK).catch(() => {
    forwardLog.debug('Creating temporary directory', { dir: tmpDir })
    return fsAsync.mkdir(tmpDir)
  })
  forwardLog.debug('Creating temporary file', { file: tmpFilePath })
  await fsAsync.open(tmpFilePath, 'w', 0o666)
  try {
    forwardLog.debug('Receiving file from Slack', { file: tmpFilePath })
    const writeStream = request.get(file.url_private, { auth: { bearer: context.botToken } }).pipe(fs.createWriteStream(tmpFilePath))
    forwardLog.debug('Received file from Slack', { url: file.url_private })
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    forwardLog.debug('Forwarding file to Slack', { url: file.url_private })
    const data = { file: fs.createReadStream(tmpFilePath) }
    const fileToUpload = buildFile({ message, target, fileMeta: file, data })
    const { file: forwardedFile } = await app.client.files.upload(fileToUpload)
    return mapFileWithMessage({ context, target, file, message, forwardedFile })
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

export const mapFileWithMessage = ({ context, target, file, message, forwardedFile }) => {
  const forwardedMessage = forwardedFile.shares.private[target.channel][0]
  return Promise.all([
    mapMessage({ team: context.teamId, ...message }, { ...target, ts: forwardedMessage.ts}),
    mapFile({ team: context.teamId, ...file }, { ...target, ...forwardedFile })
  ])
}
