import add from './add'

export default (app) => {
  add(app)
  app.action('open-conversation', ({message, say}) => {
    say('Triggered')
  })
}
