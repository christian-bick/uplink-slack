import _ from 'lodash'
import { appLog } from './logger'

const onCatch = (err, args) => {
  let context = {}
  if (args[0] !== null && typeof args[0] === 'object') {
    context = _.pick(args[0], [ 'context' ])
  }
  appLog.error({ err, ...context } )
}

export const catchAsync = (fn) => {
  return async function wrapper() {
    try {
      // eslint-disable-next-line prefer-rest-params
      await fn.apply(this, arguments)
    } catch (err) {
      // eslint-disable-next-line prefer-rest-params
      onCatch(err, arguments)
    }
  }
}
