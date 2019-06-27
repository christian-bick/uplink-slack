import {applyFormats, convertPost} from './convert-post'

const testInput = '{"version":116,"revision":279,"root":{"children":[{"type":"h1","text":"This is H1"},{"type":"h2","text":"This is H2"},{"type":"p","text":"Paragraph 1"},{"type":"p","text":"Paragraph 2"},{"type":"ul","text":"list item 1"},{"type":"ul","text":"list item 2"},{"type":"ol","text":"numbered item 1"},{"type":"ol","text":"numbered item 2"},{"type":"p","text":"A link","links":{"https://www.google.com":[0,6]}},{"type":"p","text":"Strike Through","formats":{"strike":[0,14]}},{"type":"p","text":"Bold","formats":{"b":[0,4]}},{"type":"p","text":"Underlined","formats":{"u":[0,10]}},{"type":"p","text":"Italic","formats":{"i":[0,6]}},{"type":"p","text":"Code Block","formats":{"code":[0,10]}},{"type":"pre","text":"Block"},{"type":"cl","text":"Checklist Item 1","checked":false},{"type":"cl","text":"Checklist Item 2 (checked)","checked":true}]}}'
const expectedOutput = ''

describe('applyFormats', () => {
  let params

  beforeEach('prepare', () => {
    params = { 'type': 'p', 'text': 'Code Block', 'formats': { 'code': [0, 10] } }
  })

  it('should apply format for whole string', () => {
    const text = applyFormats(params)
    expect(text).eql('`Code Block`')
  })

  it('should apply format for part of the string', () => {
    params.formats.code = [5, 10]
    const text = applyFormats(params)
    expect(text).eql('Code `Block`')
  })

  it('should apply supported formats and ignore unsupported ones', () => {
    params.formats.code = [5, 10]
    params.formats.not_supported = [0, 4]
    const text = applyFormats(params)
    expect(text).eql('Code `Block`')
  })

  it('should apply several formats at the same time', () => {
    params.formats.strike = [0, 4]
    params.formats.code = [5, 10]
    const text = applyFormats(params)
    expect(text).eql('~~Code~~ `Block`')
  })

  it('should combine formats', () => {
    params.formats.code = [5, 10]
    params.formats.strike = [0, 10]
    const text = applyFormats(params)
    expect(text).eql('~~Code `Block`~~')
  })

  it.only('should combine tress', () => {
    params.text = params.text + ' bold italic underlined'
    params.formats.code = [5, 10]
    params.formats.strike = [0, 10]
    params.formats.u = [23, 33]
    params.formats.i = [16, 33]
    params.formats.b = [11, 15]
    const text = applyFormats(params)
    expect(text).eql('~~Code `Block`~~ **bold** *italic ***underlined****')
  })


})

describe.skip('convertPost', () => {
  it('should convert to the expected output', () => {
    const output = convertPost(testInput)
    console.log(output)
  })
})
