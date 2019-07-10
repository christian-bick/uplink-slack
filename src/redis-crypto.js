import { sha256 } from 'js-sha256'
import { HASH_SALT } from './global'
import crypto from 'crypto'

const CHARACTER_ENCODING = 'utf8'
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET
const ENCRYPTION_ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_ENCODING = 'hex'
const INIT_VECTOR_LENGTH = 16

export const hashed = (value) => sha256(`${value}${HASH_SALT}`)

export const encrypt = (value) => {
  const iv = crypto.randomBytes(INIT_VECTOR_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_SECRET), iv)
  const encryptedBytes = cipher.update(value, CHARACTER_ENCODING);
  const encryptedBuffer = Buffer.concat([ encryptedBytes, cipher.final() ])
  const encryptedHex = encryptedBuffer.toString(ENCRYPTION_ENCODING)
  const ivHex = iv.toString('hex')
  return `${ivHex}:${encryptedHex}`
}

export const decrypt = (value) => {
  const parts = value.split(':')
  const ivHex = parts.shift()
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_SECRET), iv);
  const encryptedHex = parts.shift();
  const encryptedBytes = Buffer.from(encryptedHex, ENCRYPTION_ENCODING)
  const decryptedBytes = decipher.update(encryptedBytes);
  const decryptedBuffer = Buffer.concat([decryptedBytes, decipher.final()]);
  return decryptedBuffer.toString(CHARACTER_ENCODING);
}
