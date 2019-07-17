import {getMappedFileId, getMappedMessageTs, mapFile, mapMessage, removeMessageMapping} from './map-dm'

describe('map-dm', () => {
  describe('message mapping', () => {
    const messageOne = {
      team: 'team-1',
      channel: 'channel-2',
      ts: 'ts-1'
    }
    const messageTwo = {
      team: 'team-2',
      channel: 'channel-2',
      ts: 'ts-2'
    }

    it('should get mapped messages', async () => {
      await mapMessage(messageOne, messageTwo)

      const mappedByOne = await getMappedMessageTs(messageOne.team, messageOne.channel, messageOne.ts)
      expect(mappedByOne).to.equal(messageTwo.ts)

      const mappedByTwo = await getMappedMessageTs(messageTwo.team, messageTwo.channel, messageTwo.ts)
      expect(mappedByTwo).to.equal(messageOne.ts)
    })

    it('should remove mapped messages', async () => {
      await mapMessage(messageOne, messageTwo)
      await removeMessageMapping(messageOne, messageTwo)

      const mappedByOne = await getMappedMessageTs(messageOne.team, messageOne.channel, messageOne.ts)
      expect(mappedByOne).to.not.exist

      const mappedByTwo = await getMappedMessageTs(messageTwo.team, messageTwo.channel, messageTwo.ts)
      expect(mappedByTwo).to.not.exist
    })
  })

  describe('file mapping', () => {
    const fileOne = {
      team: 'team-1',
      id: 'id-1'
    }
    const fileTwo = {
      team: 'team-2',
      id: 'id-2'
    }

    it('should get mapped files', async () => {
      await mapFile(fileOne, fileTwo)

      const mappedByOne = await getMappedFileId(fileOne.team, fileOne.id)
      expect(mappedByOne).to.equal(fileTwo.id)

      const mappedByTwo = await getMappedFileId(fileTwo.team, fileTwo.id)
      expect(mappedByTwo).to.equal(fileOne.id)
    })
  })
})
