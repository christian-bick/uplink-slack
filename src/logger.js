import bunyan, { INFO } from 'bunyan'
import { obfuscatePersonalData, obfuscateValue } from './obfuscate'

const LOG_LEVEL = process.env.LOG_LEVEL || INFO

const serializeMessage = (message) => {
  return {
    type: message.type,
    subtype: message.subtype,
    userId: obfuscateValue(message.user),
    channelId: obfuscateValue(message.channel),
    ts: message.ts,
    threadTs: message.thread_ts,
    files: message.files ? message.files.length : 0
  }
}

const obfuscateSensitiveParams = {
  // Individual attributes
  teamId: obfuscateValue,
  userId: obfuscateValue,
  botId: obfuscateValue,
  channelId: obfuscateValue,
  email: obfuscateValue,
  name: obfuscateValue,
  // Common objects
  user: obfuscatePersonalData,
  team: obfuscatePersonalData,
  link: obfuscatePersonalData,
  reverseLink: obfuscatePersonalData,
  group: obfuscatePersonalData,
  registration: obfuscatePersonalData,
  context: obfuscatePersonalData,
  message: serializeMessage,
  source: obfuscatePersonalData,
  sink: obfuscatePersonalData,
  // Standard serializers
  err: bunyan.stdSerializers.err
}

const statusLog = bunyan.createLogger({ name: 'status', level: LOG_LEVEL })
const appLog = bunyan.createLogger({ name: 'app', level: LOG_LEVEL, serializers: obfuscateSensitiveParams })

export {
  statusLog,
  appLog
}
