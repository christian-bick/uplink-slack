import {convertPost} from "./convert-post"

const testInput = '{"version":116,"revision":279,"root":{"children":[{"type":"h1","text":"This is H1"},{"type":"h2","text":"This is H2"},{"type":"p","text":"Paragraph 1"},{"type":"p","text":"Paragraph 2"},{"type":"ul","text":"list item 1"},{"type":"ul","text":"list item 2"},{"type":"ol","text":"numbered item 1"},{"type":"ol","text":"numbered item 2"},{"type":"p","text":"A link","links":{"https://www.google.com":[0,6]}},{"type":"p","text":"Strike Through","formats":{"strike":[0,14]}},{"type":"p","text":"Bold","formats":{"b":[0,4]}},{"type":"p","text":"Underlined","formats":{"u":[0,10]}},{"type":"p","text":"Italic","formats":{"i":[0,6]}},{"type":"p","text":"Code Block","formats":{"code":[0,10]}},{"type":"pre","text":"Block"},{"type":"cl","text":"Checklist Item 1","checked":false},{"type":"cl","text":"Checklist Item 2 (checked)","checked":true}]}}'
const expectedOutput = ''

describe('convertPost', () => {

  it('should convert to the expected output', () => {
    const output = convertPost(testInput)
    console.log(output)
  })
})
