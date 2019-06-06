export const respondToHealthCheck = (req, resp) => {
  resp.status(200).send('OK')
}

export default (app) => {
  app.receiver.app.get('/', respondToHealthCheck)
}
