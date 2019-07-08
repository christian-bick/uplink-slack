import { obfuscateEmailAddress } from './obfuscate'

describe('obfuscate email address', () => {

  it('should replace center 4 characters of a 10 character head', () => {
    const obfuscated = obfuscateEmailAddress('1234567890@gmail.com')
    expect(obfuscated).to.equal('123****890@g***l.com')
  })

  it('should replace center 3 characters of a 9 character head', () => {
    const obfuscated = obfuscateEmailAddress('123456789@gmail.com')
    expect(obfuscated).to.equal('123***789@g***l.com')
  })

  it('should replace center 4 characters of a 8 character head', () => {
    const obfuscated = obfuscateEmailAddress('12345678@gmail.com')
    expect(obfuscated).to.equal('12****78@g***l.com')
  })

  it('should replace center 3 characters of a 7 character head', () => {
    const obfuscated = obfuscateEmailAddress('1234567@gmail.com')
    expect(obfuscated).to.equal('12***67@g***l.com')
  })

  it('should replace center 4 characters of a 5 character head', () => {
    const obfuscated = obfuscateEmailAddress('12345@gmail.com')
    expect(obfuscated).to.equal('1***5@g***l.com')
  })

  it('should replace center 2 characters of a 4 character head', () => {
    const obfuscated = obfuscateEmailAddress('1234@gmail.com')
    expect(obfuscated).to.equal('1**4@g***l.com')
  })

  it('should replace center character of a 3 character head', () => {
    const obfuscated = obfuscateEmailAddress('123@gmail.com')
    expect(obfuscated).to.equal('1*3@g***l.com')
  })

  it('should replace last character of a 2 character head', () => {
    const obfuscated = obfuscateEmailAddress('12@gmail.com')
    expect(obfuscated).to.equal('**@g***l.com')
  })

  it('should replace all characters of a 1 character head', () => {
    const obfuscated = obfuscateEmailAddress('1@gmail.com')
    expect(obfuscated).to.equal('*@g***l.com')
  })

  it('should obfuscate subdomains', () => {
    const obfuscated = obfuscateEmailAddress('1@some.gmail.com')
    expect(obfuscated).to.equal('*@som****ail.com')
  })
})
