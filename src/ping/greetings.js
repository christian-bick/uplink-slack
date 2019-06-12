export const replyToGreetings = async ({ message, say }) => {
  say(`Hello, <@${message.user}>`)
}
