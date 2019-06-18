import { linkKey } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const link = {
  set: ([sourceEmail, sinkEmail], link) => setJson(linkKey(sourceEmail, sinkEmail), link),
  get: ([sourceEmail, sinkEmail]) => getJson(linkKey(sourceEmail, sinkEmail))
}

export default link
