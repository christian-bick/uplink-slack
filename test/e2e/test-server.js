import { run } from '../../src/server'

const SERVER_PROTOCOL = 'http'
const SERVER_HOST = 'localhost'
const SERVER_PORT = 3001
const SERVER_ADDRESS = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`

let app

before(async () => {
  app = await run(3001)
})

after(async () => {
  await app.stop()
})

export {
  SERVER_PROTOCOL,
  SERVER_HOST,
  SERVER_PORT,
  SERVER_ADDRESS
}
