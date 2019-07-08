import { supportLink, userAuthLink } from '../links'

export const buildPrimaryActions = (context) => ({
  'type': 'actions',
  'elements': [{
    'type': 'button',
    'action_id': 'select-chat',
    'style': 'primary',
    'text': {
      'type': 'plain_text',
      'text': 'Start a Conversation',
      'emoji': true
    }
  }, {
    'type': 'overflow',
    'action_id': 'entry-overflow',
    'options': [
      {
        'text': {
          'type': 'plain_text',
          'text': 'Get Support',
          'emoji': true
        },
        'value': 'support',
        'url': supportLink(context)
      },
      {
        'text': {
          'type': 'plain_text',
          'text': 'Reinstall App'
        },
        'value': 'reinstall',
        'url': userAuthLink(context)
      }
    ]
  }]
})
