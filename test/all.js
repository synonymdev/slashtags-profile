const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')
const SlashtagsCoreData = require('@synonymdev/slashtags-core-data')

const SlashtagsProfile = require('../index.js')

test('construct with now core-data module', async (t) => {
  const profile = new SlashtagsProfile()

  t.ok(profile.coreData instanceof SlashtagsCoreData)

  profile.close()
})

test('Create, Update, Read, Delete', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writerCoreData = new SlashtagsCoreData(testnet)
  const writer = new SlashtagsProfile(writerCoreData)
  await writer.ready()

  const created = { name: 'foo' }

  await writer.create(created)

  const saved = await writer.read()

  t.alike(saved, created, 'created profile data locally successfully')

  const updated = { name: 'bar' }

  await writer.update(updated)

  const readerCoreData = new SlashtagsCoreData(testnet)
  const reader = new SlashtagsProfile(readerCoreData)

  const resolved = await reader.readRemote(writer.url)

  t.alike(resolved, updated, 'read profile data from swarm successfully')

  await writer.delete()

  const afterDelete = await writer.read()
  t.is(afterDelete, null, 'deleted profile locally')

  const afterDeleteReader = await reader.readRemote(writer.url)
  t.is(afterDeleteReader, null, 'deleted profile at reader')

  await writer.close()
  await reader.close()
})

test('Read empty profile', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writerCoreData = new SlashtagsCoreData(testnet)
  const writer = new SlashtagsProfile(writerCoreData)
  await writer.ready()

  const saved = await writer.read()

  t.alike(saved, null)

  const readerCoreData = new SlashtagsCoreData(testnet)
  const reader = new SlashtagsProfile(readerCoreData)

  const resolved = await reader.readRemote(writer.url)
  t.alike(resolved, null)

  await writer.close()
  await reader.close()
})

test('Read invalid profile', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writerCoreData = new SlashtagsCoreData(testnet)
  await writerCoreData.ready()

  await writerCoreData.create(SlashtagsProfile.path, new Uint8Array([1, 2, 3]))

  const readerCoreData = new SlashtagsCoreData(testnet)
  const reader = new SlashtagsProfile(readerCoreData)

  const resolved = await reader.readRemote(writerCoreData.url)
  t.alike(resolved, null)

  await writerCoreData.close()
  await reader.close()
})
