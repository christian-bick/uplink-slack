import { applyFormats, convertPost } from './convert-post'

const testInput = '{"version":116,"revision":279,"root":{"children":[{"type":"h1","text":"This is H1"},{"type":"h2","text":"This is H2"},{"type":"p","text":"Paragraph 1"},{"type":"p","text":"Paragraph 2"},{"type":"ul","text":"list item 1"},{"type":"ul","text":"list item 2"},{"type":"ol","text":"numbered item 1"},{"type":"ol","text":"numbered item 2"},{"type":"p","text":"A link","links":{"https://www.google.com":[0,6]}},{"type":"p","text":"Strike Through","formats":{"strike":[0,14]}},{"type":"p","text":"Bold","formats":{"b":[0,4]}},{"type":"p","text":"Underlined","formats":{"u":[0,10]}},{"type":"p","text":"Italic","formats":{"i":[0,6]}},{"type":"p","text":"Code Block","formats":{"code":[0,10]}},{"type":"pre","text":"Block"},{"type":"cl","text":"Checklist Item 1","checked":false},{"type":"cl","text":"Checklist Item 2 (checked)","checked":true}]}}'
const expectedOutput = ''

describe('applyFormats', () => {
  let formatParams
  let linkParams

  beforeEach('prepare', () => {
    formatParams = { 'type': 'p', 'text': 'Code Block', 'formats': { 'code': [0, 10] } }
    linkParams = { 'type': 'p', 'text': 'A link', 'links': { 'https://www.google.com': [0, 6] } }
  })

  it('should apply format for whole string', () => {
    const text = applyFormats(formatParams)
    expect(text).eql('`Code Block`')
  })

  it('should apply format for part of the string', () => {
    formatParams.formats.code = [5, 10]
    const text = applyFormats(formatParams)
    expect(text).eql('Code `Block`')
  })

  it('should apply supported formats and ignore unsupported ones', () => {
    formatParams.formats.code = [5, 10]
    formatParams.formats.not_supported = [0, 4]
    const text = applyFormats(formatParams)
    expect(text).eql('Code `Block`')
  })

  it('should apply several formats at the same time', () => {
    formatParams.formats.strike = [0, 4]
    formatParams.formats.code = [5, 10]
    const text = applyFormats(formatParams)
    expect(text).eql('~~Code~~ `Block`')
  })

  it('should combine formats', () => {
    formatParams.formats.code = [5, 10]
    formatParams.formats.strike = [0, 10]
    const text = applyFormats(formatParams)
    expect(text).eql('~~Code `Block`~~')
  })

  it('should combine tress', () => {
    formatParams.text = formatParams.text + ' bold italic underlined'
    formatParams.formats.code = [5, 10]
    formatParams.formats.strike = [0, 10]
    formatParams.formats.u = [23, 33]
    formatParams.formats.i = [16, 33]
    formatParams.formats.b = [11, 15]
    const text = applyFormats(formatParams)
    expect(text).eql('~~Code `Block`~~ **bold** *italic ***underlined****')
  })

  it('should apply link formatting', () => {
    const text = applyFormats(linkParams)
    expect(text).to.eql('[A link](https://www.google.com)')
  })

  it.only('should apply combined linked and format', () => {
    const params = {
      type: 'p',
      text: 'stroke ' + linkParams.text + ' bold',
      links: {
        'https://www.google.com': [7, 13]
      },
      formats: {
        strike: [0, 6],
        b: [14, 18]
      }
    }
    const text = applyFormats(params)
    expect(text).to.eql('~~stroke~~ [A link](https://www.google.com) **bold**')
  })
})

describe.skip('convertPost', () => {
  it('should convert to the expected output', () => {
    const output = convertPost(testInput)
    console.log(output)
  })
})
