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

test('validate profile on create', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  // @ts-ignore
  const writer = new SlashtagsProfile(testnet)
  await writer.ready()

  try {
    // @ts-ignore
    writer.create([])
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - profile must be object`)
  }

  try {
    // @ts-ignore
    writer.create({ name: 324, bio: 234, images: 123, links: { foo: 'bar' } })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links' must be array`)
  }

  try {
    // @ts-ignore
    writer.create({ name: 324, bio: 234, images: 123, links: [{}, { title: 123, url: 234 }] })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links/0' must have required property 'title'
 - Field 'links/0' must have required property 'url'
 - Field 'links/1/url' must be string
 - Field 'links/1/title' must be string`)
  }

  writer.close()
})

test('validate profile on update', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  // @ts-ignore
  const writer = new SlashtagsProfile(testnet)
  await writer.ready()

  await writer.create({})

  try {
    // @ts-ignore
    writer.update([])
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - profile must be object`)
  }

  try {
    // @ts-ignore
    writer.update({ name: 324, bio: 234, images: 123, links: { foo: 'bar' } })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links' must be array`)
  }

  try {
    // @ts-ignore
    writer.update({ name: 324, bio: 234, images: 123, links: [{}, { title: 123, url: 234 }] })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links/0' must have required property 'title'
 - Field 'links/0' must have required property 'url'
 - Field 'links/1/url' must be string
 - Field 'links/1/title' must be string`)
  }

  writer.close()
})
