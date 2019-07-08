import { sha256 } from 'js-sha256'
import { HASH_SALT } from './global'

export const hashed = (value) => sha256(`${value}${HASH_SALT}`)
