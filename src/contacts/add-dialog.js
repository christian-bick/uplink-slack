export const showAddContactsDialog = (app) => async ({ body, context, ack }) => {
  ack()
  await app.client.dialog.open(buildAddContactsDialog(context.botToken, body.trigger_id))
}

export const buildAddContactsDialog = (token, triggerId) => ({
  'token': token,
  'trigger_id': triggerId,
  'dialog': {
    'callback_id': 'add-contacts',
    'title': 'Add Contacts',
    'submit_label': 'Add',
    'elements': [
      {
        'type': 'textarea',
        'label': 'List of email addresses',
        'name': 'contacts',
        'hint': 'You can basically copy paste everything here that contains email addresses.',
        'placeholder': 'john.smith@example.com\nsophie.miller@example.com'
      }
    ]
  }
})
