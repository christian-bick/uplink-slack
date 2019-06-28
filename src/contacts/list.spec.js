import { filterEmails, rateEmail } from './list'

describe('rateEmails', () => {
  it('exact matches should be rated 1', () => {
    const rating = rateEmail(['x@y.com'], 'x@y.com')
    expect(rating).to.equal(1)
  })

  it('exact matches of head parts should be rated 1', () => {
    const rating = rateEmail(['very', 'nice'], 'very.nice@y.com')
    expect(rating).to.equal(1)
  })

  it('exact matches of joined head parts should be rated 1', () => {
    const rating = rateEmail(['very', 'nice'], 'verynice@y.com')
    expect(rating).to.equal(1)
  })

  it('starts with match of starting string be rated 1', () => {
    const rating = rateEmail(['very'], 'verynice@y.com')
    expect(rating).to.eql(1)
  })

  it('missing characters should be rated highly', () => {
    const rating = rateEmail(['verynice'], 'very.nice@y.com')
    expect(rating).to.be.above(0.7)
  })

  it('twisted characters should be rated highly', () => {
    const rating = rateEmail(['veryniec'], 'verynice@y.com')
    expect(rating).to.be.above(0.5)
  })

  it('miss match should not be rated low', () => {
    const rating = rateEmail(['hello'], 'verynice@y.com')
    expect(rating).to.be.below(0.5)
  })

  it('partial match should not be rated low', () => {
    const rating = rateEmail(['very', 'hello'], 'very.shallow@gmail.com')
    expect(rating).to.be.below(0.5)
  })

  it('tail match should not be rated low', () => {
    const rating = rateEmail(['very', 'hello'], 'very.shallow@gmail.com')
    expect(rating).to.be.below(0.5)
  })
})

describe('filterEmails', () => {
  it('should keep exact match', () => {
    const result = filterEmails('x@y.com', [ 'x@y.com' ])
    expect(result).to.eql([ 'x@y.com' ])
  })

  it('should filter non-match', () => {
    const result = filterEmails('a@b.net', [ 'x@y.com' ])
    expect(result).to.be.empty
  })
})
