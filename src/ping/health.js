export const respondToHealthCheck = (req, resp) => {
  resp.status(200).send('OK')
}
