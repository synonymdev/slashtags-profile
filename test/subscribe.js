const test = require('brittle')
const createTestnet = require('@hyperswarm/testnet')

const SlashtagsProfile = require('../index.js')

test('watch profile updated', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const reader = new SlashtagsProfile(testnet)
  await reader.ready()

  const tw = t.test('watcher')
  tw.plan(2)

  let calls = 0

  const cleanup = reader.subscribe(
    writer.url,
    (profile) => {
      if (calls++ === 0) {
        // First call
        tw.alike(profile, created)
      } else {
        // Second call
        tw.alike(profile, updated)
      }
    }
  )

  await sleep(100)

  const updated = { name: 'bar' }
  await writer.update(updated)

  await tw

  cleanup()
  t.is(reader.coreData._remoteDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
  reader.close()
})

test('watch profile deleted', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const reader = new SlashtagsProfile(testnet)
  await reader.ready()

  const tw = t.test('watcher')
  tw.plan(2)

  let count = 0

  const cleanup = reader.subscribe(
    writer.url,
    (profile) => {
      if (count++ === 0) {
        tw.alike(profile, created)
      } else {
        tw.alike(profile, null)
      }
    }
  )

  await sleep(100)

  await writer.delete()

  await tw

  cleanup()
  t.is(reader.coreData._remoteDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
  reader.close()
})

test('watch local profile updated', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  const writer = new SlashtagsProfile(testnet)

  const created = { name: 'foo' }
  await writer.create(created)

  const tw = t.test('watcher')
  tw.plan(1)

  const cleanup = writer.subscribe(
    writer.url,
    (profile) => {
      tw.alike(profile, updated)
    }
  )

  const updated = { name: 'bar' }
  await writer.update(updated)

  await tw

  cleanup()
  t.is(writer.coreData._localDrives.values().next().value.core._events.append.length, 0, 'removed append listener')

  writer.close()
})

/** @param {number} ms */
function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
