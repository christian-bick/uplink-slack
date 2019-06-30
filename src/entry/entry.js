import store from '../store'
import {  userAuthLink } from '../global'
import {buildPrimaryActions} from "./entry-actions"

export const reactToAppHomeOpened = (app) => async ({ context, event, say }) => {
  const user = await store.slack.user.get([context.teamId, context.userId])

  const { messages: oldMessages } = await app.client.conversations.history({
    token: context.botToken,
    channel: event.channel,
    limit: 1
  })
  const lastMessage = oldMessages && oldMessages[0]

  if (!user) {
    if (!lastMessage || lastMessage.text !== PERMISSIONS_TEXT) {
      say(buildPermissionMessage(context))
    }
  } else if (!lastMessage || !lastMessage.bot_id || lastMessage.text === PERMISSIONS_TEXT) {
    const message = buildEntryMessage(context)
    say(message)
  }
}

export const PERMISSIONS_TEXT = 'Let\'s get started!'
export const ENTRY_TEXT = '*You are ready to go!* Start messaging contacts outside of this workspace.'

export const buildPermissionMessage = (context) => ({
  text: PERMISSIONS_TEXT,
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `:wave: *Nice to meet you!* You are just one step away from messaging with contacts on other Slack workspaces.`
      }
    }, {
      'type': 'divider'
    }, {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': 'Just before we can start, I need to ask for some permissions.'
      },
      'accessory': {
        'action_id': 'user-install-init',
        'type': 'button',
        'url': userAuthLink(context),
        'text': {
          'type': 'plain_text',
          'text': 'Grant Permissions',
          'emoji': false
        }
      }
    }, {
      'type': 'divider'
    }
  ]
})

export const buildEntryMessage = (context) => ({
  text: ENTRY_TEXT,
  blocks: [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': ENTRY_TEXT
      }
    }, {
      'type': 'divider'
    }, buildPrimaryActions(context), {
      'type': 'divider'
    }
  ]
})
