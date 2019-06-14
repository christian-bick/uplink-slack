import { slackLink } from '../redis-keys'
import { getJson, setJson } from '../redis-ops'

const set = (sourceEmail, sinkEmail, link) => setJson(slackLink(sourceEmail, sinkEmail), link)
const get = (sourceEmail, sinkEmail) => getJson(slackLink(sourceEmail, sinkEmail))

export default {
  set, get
}
