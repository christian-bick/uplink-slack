import json2md from 'json2md'

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

// Formats text in a given range, surrounding it with an opening and closing tag
export const formatText = (openingTag, closingTag = openingTag) => (range, text) => {
  const start = range[0]
  const end = range[1]
  const head = text.substring(0, start)
  const body = text.substring(start, end)
  const tail = text.substring(end, text.length)
  return `${head}${openingTag}${body}${closingTag}${tail}`
}

// Maps a formatting tag to its respective formatting function
export const formatMappers = {
  code: formatText(TAGS.code),
  strike: formatText(TAGS.strike),
  i: formatText(TAGS.i),
  b: formatText(TAGS.b),
  u: formatText(TAGS.u)
}

// [1, 2, 3, 4, .. ] => [ [1, 2], [3, 4], .. ]
export const splitListIntoTuples = (rangeArray) => {
  return rangeArray.reduce((result, value, index) => {
    if (index % 2 === 0) {
      return [...result, [value, null]]
    } else {
      result[result.length - 1][1] = value
      return result
    }
  }, [])
}

export const applyFormats = (params) => {
  const formats = params.formats
  const links = params.links

  // [{ type: 'p', formats: { b: [0, 3, 4, 9], strike: [0, 3] }, text: 'hey there' }
  // =>
  // [{ action: mapperForBold, shift: 2, range: [0, 3] },
  // { action: mapperForBold, shift: 2, range: [4, 9] },
  // { action: mapperForStrike, shift: 2, range: [0, 3] } ]
  const formatActions = !formats ? [] : Object.keys(formats).reduce((previous, formatType) => {
    const mapper = formatMappers[formatType]
    if (!mapper) {
      return previous
    } else {
      const shift = TAGS[formatType].length
      const rangeList = splitListIntoTuples(formats[formatType])
      const actionList = rangeList.map(range => ({ action: mapper, shift, range }))
      return [ ...previous, ...actionList ]
    }
  }, [])

  // [{ type: 'p', links: { 'http://example.com': [0, 7] }, text: 'Example' }
  // =>
  // [{ action: mapperForLink, shift: 22, range: [0, 7] }]
  const linkActions = !links ? [] : Object.keys(links).reduce((previous, url) => {
    const mapper = formatText('[', `](${url})`)
    return [ ...previous, { action: mapper, shift: url.length + 2, range: links[url] } ]
  }, [])

  const actions = [...linkActions, ...formatActions]

  // Sorts actions so that we can later assume that we:
  // 1) apply actions from the back to front on the same hierarchy level
  // 2) from the inside to the outside between different hierarchy levels of nested actions
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

  // Shifts ranges according to the application of other actions.
  // Given the preconditions after sorting, we can minimize the amount of shifts
  // to the end positions of higher hierarchy actions for nested actions.
  // We can track this with a a position pointer of the last processed
  // action's range end that will be smaller the the next action's range end
  // while we move up in a hierarchy.
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

  return shiftedActions.reduce((previous, { action, range }) => action(range, previous), params.text)
}

// Converts Slack's JSON structure into something
// that json2md can process
export const convertJson = originalJson => originalJson
  .filter(({ type }) => {
    // Skip what we can't conver
    return !!json2md.converters[type]
  })
  .map((params) => {
    // Apply formats and links
    return { ...params, text: applyFormats(params) }
  })
  .map((params) => {
    // Map types to converters
    return typeMappers[params.type] ? { ...params, text: typeMappers[params.type](params) } : params
  })
  .reduce((result, { type, text }, index) => {
    // Merges the values of list types into an array
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
