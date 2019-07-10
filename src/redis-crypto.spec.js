import {decrypt, encrypt} from './redis-crypto'

describe('redis crypto', () => {
  it('should encrypt and decrypt text', () => {
    const input = 'text'
    const encrypted = encrypt(input)
    const decrypted = decrypt(encrypted)
    expect(decrypted).to.eql(input)
  })
})
