const test = require('brittle')
const { Client, Relay } = require('@synonymdev/web-relay')
const os = require('os')

const SlashtagsProfile = require('../index.js')

test('Create, Update, Read, Delete', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const writerClient = new Client({ storage: tmpdir(), relay: address })
  const writer = new SlashtagsProfile(writerClient)

  const created = { name: 'foo' }

  await writer.put(created)

  const saved = await writer.get()

  t.alike(saved, created, 'created profile data locally successfully')

  const updated = { name: 'bar' }

  await writer.put(updated)

  const url = await writer.createURL()

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new SlashtagsProfile(readerClient)

  const resolved = await reader.get(url)

  t.alike(resolved, updated, 'read profile data from swarm successfully')

  await writer.del()

  const afterDelete = await writer.get()
  t.is(afterDelete, null, 'deleted profile locally')

  // First read returns from local storage, while fetching from relay.
  reader.get(url)
  await sleep(500)

  const afterDeleteReader = await reader.get(url)
  t.is(afterDeleteReader, null, 'deleted profile at reader')

  writer.close()
  reader.close()
  relay.close()
})

test('Read empty profile', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const writerClient = new Client({ storage: tmpdir(), relay: address })
  const writer = new SlashtagsProfile(writerClient)

  const saved = await writer.get()

  t.alike(saved, null)

  const url = await writer.createURL()

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new SlashtagsProfile(readerClient)

  const resolved = await reader.get(url)
  t.alike(resolved, null)

  writer.close()
  reader.close()
  relay.close()
})

test('Read invalid profile', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const writerClient = new Client({ storage: tmpdir(), relay: address })
  const writer = new SlashtagsProfile(writerClient)

  await writerClient.put(SlashtagsProfile.path, new Uint8Array([1, 2, 3]))

  const url = await writer.createURL()

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new SlashtagsProfile(readerClient)

  const resolved = await reader.get(url)
  t.alike(resolved, null)

  writer.close()
  reader.close()
  relay.close()
})

test('validate profile on create', async (t) => {
  const writerClient = new Client({ storage: tmpdir() })
  const writer = new SlashtagsProfile(writerClient)

  try {
    // @ts-ignore
    writer.put([])
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - profile must be object`)
  }

  try {
    // @ts-ignore
    writer.put({ name: 324, bio: 234, images: 123, links: { foo: 'bar' } })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links' must be array`)
  }

  try {
    // @ts-ignore
    writer.put({ name: 324, bio: 234, images: 123, links: [{}, { title: 123, url: 234 }] })
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
  const writerClient = new Client({ storage: tmpdir() })
  const writer = new SlashtagsProfile(writerClient)

  await writer.put({})

  try {
    // @ts-ignore
    writer.put([])
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - profile must be object`)
  }

  try {
    // @ts-ignore
    writer.put({ name: 324, bio: 234, images: 123, links: { foo: 'bar' } })
  } catch (error) {
    t.is(error.message,
      `Invalid profile:
 - Field 'name' must be string
 - Field 'bio' must be string
 - Field 'links' must be array`)
  }

  try {
    // @ts-ignore
    writer.put({ name: 324, bio: 234, images: 123, links: [{}, { title: 123, url: 234 }] })
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

test('watch profile updated', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const writerClient = new Client({ storage: tmpdir(), relay: address })
  const writer = new SlashtagsProfile(writerClient)

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new SlashtagsProfile(readerClient)

  const url = await writer.createURL()

  const created = { name: 'foo' }
  const updated = { name: 'bar' }

  const te = t.test('eventsource')
  te.plan(3)

  const unsbuscribe = writer.subscribe(url, (profile) => {
    te.alike(profile, created, 'subscribe local')
  })

  let count = 0
  reader.subscribe(url, (profile) => {
    if (count++ === 0) {
      te.alike(profile, created)
    } else {
      te.alike(profile, updated)
    }
  })

  await writer.put(created)

  await sleep(100)

  // Subscribe closes eventsource
  unsbuscribe()

  await writer.put(updated)

  await te

  // Closing the client closes all subscriptions
  await reader.close()

  relay.close()
})

test('watch profile deleted', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const writerClient = new Client({ storage: tmpdir(), relay: address })
  const writer = new SlashtagsProfile(writerClient)

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new SlashtagsProfile(readerClient)

  const url = await writer.createURL()

  const created = { name: 'foo' }

  const te = t.test('eventsource')
  te.plan(3)

  const unsbuscribe = writer.subscribe(url, (profile) => {
    te.alike(profile, created, 'subscribe local')
  })

  let count = 0
  reader.subscribe(url, (profile) => {
    if (count++ === 0) {
      te.alike(profile, created)
    } else {
      te.alike(profile, null)
    }
  })

  await writer.put(created)

  await sleep(100)

  // Subscribe closes eventsource
  unsbuscribe()

  await writer.del()

  await te

  // Closing the client closes all subscriptions
  await reader.close()

  relay.close()
})

test.skip('watch local profile updated (without relay)', async (t) => {
  const writerClient = new Client({ storage: tmpdir() })
  const writer = new SlashtagsProfile(writerClient)

  const created = { name: 'foo' }
  await writer.put(created)

  const url = await writer.createURL()

  const tw = t.test('watcher')
  tw.plan(1)

  const cleanup = writer.subscribe(
    url,
    (profile) => {
      tw.alike(profile, updated)
    }
  )

  const updated = { name: 'bar' }
  await writer.put(updated)

  await tw

  cleanup()

  writer.close()
})

/** returns {string} */
function tmpdir () {
  return os.tmpdir() + '/' + Math.random().toString(16).slice(2)
}

/** @param {number} ms */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
