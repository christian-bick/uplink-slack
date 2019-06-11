import { extractEmails, findEmailLinks, reduceEmailLinks } from './email'

describe('findEmailLinks', () => {
  it('should find sole link', () => {
    const emailList = findEmailLinks('<mailto:x@y.com|x@y.com>')
    expect(emailList).to.have.lengthOf(1)
    expect(emailList[0]).to.equal('<mailto:x@y.com|x@y.com>')
  })

  it('should find two links', () => {
    const emailList = findEmailLinks('<mailto:x@y.com|x@y.com> <mailto:a@b.com|a@b.com>')
    expect(emailList).to.eql(['<mailto:x@y.com|x@y.com>', '<mailto:a@b.com|a@b.com>'])
  })

  it('should find links scattered across a text', () => {
    const emailList = findEmailLinks('xyz, <mailto:x@y.com|x@y.com> omg!!! <mailto:a@b.com|a@b.com>')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('<mailto:x@y.com|x@y.com>')
    expect(emailList[1]).to.equal('<mailto:a@b.com|a@b.com>')
  })
})

describe('reduceEmailLinks', () => {
  it('should return linked email address', () => {
    const emailAddressLinks = reduceEmailLinks(['<mailto:first@y.com|second@y.com>'])
    expect(emailAddressLinks).to.eql(['first@y.com'])
  })

  it('should reduce multiple email addresses', () => {
    const emailAddressLinks = reduceEmailLinks(['<mailto:x@y.com|x@y.com>', '<mailto:a@b.com|a@b.com>'])
    expect(emailAddressLinks).to.eql(['x@y.com', 'a@b.com'])
  })

  it('should remove duplicates ', () => {
    const emailAddressLinks = reduceEmailLinks(['<mailto:a@b.com|a@b.com>', '<mailto:a@b.com|a@b.com>'])
    expect(emailAddressLinks).to.eql(['a@b.com'])
  })

  it('should return an empty list for empty input', () => {
    const emailAddressLinks = reduceEmailLinks([])
    expect(emailAddressLinks).to.eql([])
  })
})

describe('extractEmails', () => {
  it('should find a sole email', () => {
    const emailList = extractEmails('max@example.com')
    expect(emailList).to.have.lengthOf(1)
    expect(emailList[0]).to.equal('max@example.com')
  })

  it('should find a two emails', () => {
    const emailList = extractEmails('max@example.com alex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })

  it('should find emails scattered across a text', () => {
    const emailList = extractEmails('xyz, max@example.com omg!! alex@example.com')
    expect(emailList).to.have.lengthOf(2)
    expect(emailList[0]).to.equal('max@example.com')
    expect(emailList[1]).to.equal('alex@example.com')
  })
})
