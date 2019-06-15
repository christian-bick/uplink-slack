import { extractEmails } from './email'

describe('extractEmails', () => {
  it('should find a sole email', () => {
    const emailList = extractEmails('max@example.com')
    expect(emailList).to.have.lengthOf(1)
    expect(emailList[0]).to.equal('max@example.com')
  })

  it('should find two emails separated by space', () => {
    const emailList = extractEmails('max@example.com alex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })

  it('should find two emails separated by new line', () => {
    const emailList = extractEmails('max@example.com\nalex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })

  it('should find two emails separated by new comma', () => {
    const emailList = extractEmails('max@example.com,alex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })

  it('should find emails scattered across a text', () => {
    const emailList = extractEmails('xyz, max@example.com, some text, alex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })
})
