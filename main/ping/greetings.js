export const replyToGreetings = async ({ message, say }) => {
  say(`Hello, <@${message.user}>`)
}

export default (app) => {
  app.message('hi', replyToGreetings)
}
