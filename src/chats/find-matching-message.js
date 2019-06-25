export const findMatchingMessage = async ({ app, channel, token, ts }) => {
  const { messages } = await app.client.conversations.history({
    token: token,
    channel: channel,
    oldest: ts,
    limit: 1
  })
  return messages.length > 0 ? messages[0] : null
}
