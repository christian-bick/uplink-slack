import { catchAsync } from '../errors-async'
import { uninstallTeam } from './uninstall'

export default (app) => {
  app.event('app_uninstalled', catchAsync(uninstallTeam(app)))
}
