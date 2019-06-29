/* eslint-disable camelcase */
import uuid from 'uuid/v4'
import request from 'request'
import requestAsync from 'request-promise-native'
import fs, { promises as fsAsync } from 'fs'

import { appLog } from '../logger'
import { findMatchingMessage } from './find-matching-message'
import { convertPost } from './convert-post'

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

export const forwardText = async ({ app, target, message }) => {
  await app.client.chat.postMessage({
    ...target,
    text: message.text
  })
}

export const forwardTextAsMe = async ({ app, target, message }) => {
  await app.client.chat.postMessage({
    ...target,
    text: `_${message.text}_`
  })
}

export const forwardUpdate = async ({ app, target, message, context }) => {
  const { ts, thread_ts, parent_user_id } = message.previous_message

  const parent = thread_ts ? { userId: parent_user_id, ts: thread_ts } : null

  const matchingMessage = await findMatchingMessage({
    app,
    channelId: target.channel,
    teamId: target.team,
    botId: context.botId,
    userId: context.userId,
    ts,
    parent
  })

  await app.client.chat.update({
    ...target,
    text: message.message.text,
    ts: matchingMessage.ts
  })
}

export const forwardDeletion = async ({ app, target, message, context }) => {
  const { ts, thread_ts, parent_user_id } = message.previous_message

  const parent = thread_ts ? { userId: parent_user_id, ts: thread_ts } : null

  const matchingMessage = await findMatchingMessage({
    app,
    channelId: target.channel,
    teamId: target.team,
    botId: context.botId,
    userId: context.userId,
    ts,
    parent
  })

  await app.client.chat.delete({
    ...target,
    ts: matchingMessage.ts
  })
}

export const forwardFileAsPost = async ({ app, message, context, target }, index = 0) => {
  const fileMeta = message.files[index]
  const content = await requestAsync.get(fileMeta.url_private, { auth: { bearer: context.botToken } })
  const convertedContent = convertPost(content)
  const data = { content: convertedContent }
  const forwardedFile = buildFile({ message, target, fileMeta, data })
  await app.client.files.upload(forwardedFile)
}

export const forwardFileAsSnippet = async ({ app, context, target, message }, index = 0) => {
  const fileMeta = message.files[index]
  const content = await requestAsync.get(fileMeta.url_private, { auth: { bearer: context.botToken } })
  const data = { content }
  const forwardedFile = buildFile({ message, target, fileMeta, data })
  await app.client.files.upload(forwardedFile)
}

export const forwardFileAsMultipart = async ({ app, context, target, message }, index = 0) => {
  const fileMeta = message.files[index]
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
    const writeStream = request.get(fileMeta.url_private, { auth: { bearer: context.botToken } }).pipe(fs.createWriteStream(tmpFilePath))
    forwardLog.debug('Received file from Slack', { url: fileMeta.url_private })
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    forwardLog.debug('Forwarding file to Slack', { url: fileMeta.url_private })
    const data = { file: fs.createReadStream(tmpFilePath) }
    const forwardedFile = buildFile({ message, target, fileMeta, data })
    await app.client.files.upload(forwardedFile)
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
