import { listContactsAsOptions } from './list-contacts-as-options'
import { inviteContact } from './invite-contact'
import { blockContact } from './block-contact'
import { unblockContact } from './unblock-contact'
import { manageBlacklistDialog } from './manage-blacklist-dialog'
import { catchAsync } from '../errors-async'

export default (app) => {
  app.options({ callback_id: 'open-chat' }, catchAsync(listContactsAsOptions(app)))
  app.action('invite-contact', catchAsync(inviteContact(app)))
  app.action('block-contact', catchAsync(blockContact(app)))
  app.action({ callback_id: 'unblock-contact' }, catchAsync(unblockContact(app)))
  app.action('entry-block', { value: 'manage-blacklist' }, catchAsync(manageBlacklistDialog(app)))
}
