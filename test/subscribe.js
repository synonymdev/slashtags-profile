const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')

const SlashtagsProfile = require('../index.js')

test('watch file updated', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const reader = new SlashtagsProfile(testnet)

  const tw = t.test('watcher')
  tw.plan(2)

  const cleanup = await reader.subscribe(
    writer.url,
    (value, prev) => {
      tw.alike(value, updated)
      tw.alike(prev, created)
    }
  )

  const updated = { name: 'bar' }
  await writer.update(updated)

  await tw

  cleanup()
  t.is(reader.coreData._remoteDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
  reader.close()
})

test('watch file deleted', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const reader = new SlashtagsProfile(testnet)

  const tw = t.test('watcher')
  tw.plan(2)

  const cleanup = await reader.subscribe(
    writer.url,
    (value, prev) => {
      tw.alike(value, null)
      tw.alike(prev, created)
    }
  )

  await writer.delete()

  await tw

  cleanup()
  t.is(reader.coreData._remoteDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
  reader.close()
})

test('watch local file updated', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const tw = t.test('watcher')
  tw.plan(2)

  const cleanup = await writer.subscribe(
    writer.url,
    (value, prev) => {
      tw.alike(value, updated)
      tw.alike(prev, created)
    }
  )

  const updated = { name: 'bar' }
  await writer.update(updated)

  await tw

  cleanup()
  t.is(writer.coreData._localDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
})
