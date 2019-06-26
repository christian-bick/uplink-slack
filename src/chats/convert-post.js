import json2md from 'json2md'

json2md.converters.ul = (input) => input.map(item => `- ${item}`).join('\n')
json2md.converters.ol = (input) => input.map((item, index) => `${index + 1}. ${item}`).join('\n')
json2md.converters.cl = (input) => input.map(item => `${item}`).join('\n')

const MERGE_TYPES = ['ul', 'ol', 'cl']

const preMappers = {
  cl: ({ type, text, checked }) => ({ type, text: `[${checked ? 'x' : ''}] ${text}` })
}

export const convertJson = originalJson => originalJson
  .filter(({ type }) => {
    return !!json2md.converters[type]
  })
  .map((params) => preMappers[params.type] ? preMappers[params.type](params) : params )
  .reduce((result, { type, text }, index) => {
    const prev = index > 0 ? result[result.length - 1] : 0
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
