import { run } from '../../src/server'

const SERVER_PROTOCOL = 'http'
const SERVER_HOST = 'localhost'
const SERVER_PORT = 3001
const SERVER_ADDRESS = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`

export {
  SERVER_PROTOCOL,
  SERVER_HOST,
  SERVER_PORT,
  SERVER_ADDRESS
}

// The following will start a test server before all tests are run and stop it when all tests have finished
let app

before(async () => {
  app = await run(SERVER_PORT)
})

after(async () => {
  await app.stop()
})
