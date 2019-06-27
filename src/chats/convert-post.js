import json2md from 'json2md'
import link from '../store/link'

export const TAGS = {
  code: '`',
  block: '```',
  strike: '~~',
  i: '*',
  b: '**',
  u: '***' // Looks like there is no Markdown equivalent for underlined, using bold-italic instead
}

json2md.converters.ul = (input) => input.map(item => `- ${item}`).join('\n')
json2md.converters.ol = (input) => input.map((item, index) => `${index + 1}. ${item}`).join('\n')
json2md.converters.cl = (input) => input.join('\n')
json2md.converters.pre = (input) => `${TAGS.block}\n${input}\n${TAGS.block}`

const MERGE_TYPES = ['ul', 'ol', 'cl']

const typeMappers = {
  cl: ({ type, text, checked }) => `[${checked ? 'x' : ''}] ${text}`
}

export const formatText = (openingTag, closingTag = openingTag) => (range, text) => {
  const start = range[0]
  const end = range[1]
  const head = text.substring(0, start)
  const body = text.substring(start, end)
  const tail = text.substring(end, text.length)
  return `${head}${openingTag}${body}${closingTag}${tail}`
}

export const formatMappers = {
  code: formatText(TAGS.code),
  strike: formatText(TAGS.strike),
  i: formatText(TAGS.i),
  b: formatText(TAGS.b),
  u: formatText(TAGS.u)
}

export const applyFormats = (params) => {
  const formats = params.formats
  const links = params.links

  const formatActions = !formats ? [] : Object.keys(formats).reduce((previous, formatType) => {
    const mapper = formatMappers[formatType]
    if (!mapper) {
      return previous
    } else {
      return [...previous, { action: mapper, shift: TAGS[formatType].length, range: formats[formatType] }]
    }
  }, [])

  const linkActions = !links ? [] : Object.keys(links).reduce((previous, url) => {
    const mapper = formatText('[', `](${url})`)
    return [ ...previous, { action: mapper, shift: url.length + 2, range: links[url] } ]
  }, [])

  const actions = [...linkActions, ...formatActions]

  const sortedActions = actions.sort((x, y) => {
    const startDateBigger = x.range[0] > y.range[0]
    const endDateBigger = x.range[1] > y.range[1]
    if (startDateBigger && endDateBigger) {
      return -1
    } else if (startDateBigger && !endDateBigger) {
      return -1
    } else {
      return 1
    }
  })

  const { shiftedActions } = sortedActions.reduce((previous, action) => {
    const nextShift = action.range[1] >= previous.position ? previous.shift : 0
    const shiftedRange = [ action.range[0], action.range[1] + nextShift * 2 ]
    const shiftedAction = { ...action, range: shiftedRange }
    return {
      shiftedActions: [...previous.shiftedActions, shiftedAction],
      shift: nextShift + action.shift,
      position: action.range[1]
    }
  }, { shiftedActions: [], shift: 0, position: params.text.length })

  console.log(shiftedActions)

  return shiftedActions.reduce((previous, { action, range }) => action(range, previous), params.text)
}

export const convertJson = originalJson => originalJson
  .filter(({ type }) => {
    return !!json2md.converters[type]
  })
  .map((params) => {
    return { ...params, text: applyFormats(params) }
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
