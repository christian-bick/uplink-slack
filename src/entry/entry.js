import store from '../store'
import { userAuthLink } from '../links'
import { buildPrimaryActions } from './entry-actions'
import { block, element, object, TEXT_FORMAT_MRKDWN } from 'slack-block-kit'

const { text } = object
const { section, divider } = block
const { button } = element

export const reactToAppHomeOpened = (app) => async ({ context, event, say }) => {
  const user = await store.slack.user.get([context.teamId, context.userId])

  const { messages: oldMessages } = await app.client.conversations.history({
    token: context.botToken,
    channel: event.channel,
    limit: 1
  })
  const lastMessage = oldMessages && oldMessages[0]

  if (!user) {
    if (!lastMessage || !lastMessage.bot_id || lastMessage.text !== PERMISSIONS_TEXT) {
      say(buildPermissionMessage(context))
    }
  } else if (!lastMessage || !lastMessage.bot_id || lastMessage.text === PERMISSIONS_TEXT) {
    const message = buildEntryMessage(context)
    say(message)
  }
}

export const PERMISSIONS_TEXT = 'Let\'s get started!'
export const ENTRY_TEXT = 'You are ready to go!'

export const buildPermissionMessage = (context) => ({
  text: PERMISSIONS_TEXT,
  blocks: [
    section(
      text(':wave: *Nice to meet you!* You are just one step away from messaging with contacts on other ' +
        'Slack workspaces.', TEXT_FORMAT_MRKDWN)
    ),
    divider(),
    section(
      text('Just before we can start, you need to review and grant some permissions.'),
      {
        accessory: button('user-install-init', 'Grant Permissions', { url: userAuthLink(context) })
      }
    ),
    divider()
  ]
})

export const buildEntryMessage = (context) => ({
  text: ENTRY_TEXT,
  blocks: [
    section(
      text(':+1: *You are ready to go!* Start messaging contacts outside of this workspace.', TEXT_FORMAT_MRKDWN)
    ),
    divider(),
    buildPrimaryActions(context),
    divider()
  ]
})
