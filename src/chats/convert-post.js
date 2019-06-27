import json2md from 'json2md'

const BLOCK = '```'
const STRIKE = '~~'
const ITALIC = '*'
const BOLD = '**'

json2md.converters.ul = (input) => input.map(item => `- ${item}`).join('\n')
json2md.converters.ol = (input) => input.map((item, index) => `${index + 1}. ${item}`).join('\n')
json2md.converters.cl = (input) => input.join('\n')
json2md.converters.pre = (input) => `${BLOCK}\n${input}\n${BLOCK}`

const MERGE_TYPES = ['ul', 'ol', 'cl']

const typeMappers = {
  cl: ({ type, text, checked }) => `[${checked ? 'x' : ''}] ${text}`
}

export const formatText = (range, text, formatter) => {
  const start = range[0]
  const end = range[1]
  const head = text.substring(0, start)
  const body = text.substring(start, end)
  const tail = text.substring(end, text.length)
  return `${head}${formatter}${body}${formatter}${tail}`
}

export const formatMappers = {
  code: (range, text) => formatText(range, text, BLOCK),
  strike: (range, text) => formatText(range, text, STRIKE),
  i: (range, text) => formatText(range, text, ITALIC),
  b: (range, text) => formatText(range, text, BOLD),
  u: (range, text) => formatText(range, text, BOLD)
}

export const applyFormats = (params) => {
  const formats = params.formats
  return Object.keys(formats).reduce((result, formatType) => {
    return formatMappers[formatType] ? formatMappers[formatType](formats[formatType], result) : result
  }, params.text)
}

export const convertJson = originalJson => originalJson
  .filter(({ type }) => {
    return !!json2md.converters[type]
  })
  .map((params) => {
    return params.formats ? { ...params, text: applyFormats(params) } : params
  })
  .map((params) => {
    return typeMappers[params.type] ? { ...params, text: typeMappers[params.type](params) } : params
  })
  .reduce((result, { type, text }, index) => {
    const prev = index > 0 ? result[result.length - 1] : null
    if (MERGE_TYPES.includes(type)) {
      if (prev && Object.keys(prev).includes(type)) {
        prev[type].push(text)
      } else {
        result.push({ [type]: [ text ] })
      }
    } else {
      result.push({ [type]: text })
    }
    return result
  }, [])

export const convertPost = (fileContent) => {
  const originalJson = JSON.parse(fileContent).root.children
  const convertedJson = convertJson(originalJson)
  return json2md(convertedJson)
}
