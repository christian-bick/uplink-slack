import { reactToAppHomeOpened } from './entry'
import { catchAsync } from '../errors-async'
import {manageBlacklistDialog} from "../contacts/manage-blacklist-dialog"

const dispatchEntryOverflow = (app) => async (params) => {
  switch (params.action.selected_option.value) {
    case 'support':
    case 'reinstall':
      params.ack()
      return
    case 'manage-blacklist':
      await manageBlacklistDialog(app)(params)
      return
    default:
      throw new Error('unimplemented option selected')
  }
}

export default (app) => {
  app.event('app_home_opened', catchAsync(reactToAppHomeOpened(app)))
  app.action('entry-overflow', catchAsync(dispatchEntryOverflow(app)))
  app.action('contact-support', ({ ack }) => ack())
  app.action('user-install-init', ({ ack }) => ack())
}
