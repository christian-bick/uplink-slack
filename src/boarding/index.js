import { reactToAppHomeOpened } from './boarding'

export default (app) => {
  app.event('app_home_opened', reactToAppHomeOpened)
}
