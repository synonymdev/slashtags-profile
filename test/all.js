const test = require('brittle')
const Corestore = require('corestore')
const RAM = require('random-access-memory')
const Hyperswarm = require('hyperswarm')
const createTestnet = require('@hyperswarm/testnet')
const b4a = require('b4a')

const SlashtagsProfile = require('../index.js')

test('Create, Update, Read, Delete', async (t) => {
  const testnet = createTestnet(3, t.teardown)

  const swarmA = new Hyperswarm(testnet)
  const corestoreA = new Corestore(RAM)

  const writer = new SlashtagsProfile({
    swarm: swarmA,
    corestore: corestoreA.namespace('foo')
  })

  const created = {
    name: 'foo'
  }

  await writer.create(created)

  const saved = await writer._drive.get('/profile.json')
    .then(buf => buf && b4a.toString(buf))
    .then(JSON.parse)

  t.alike(saved, created, 'created profile data locally successfully')

  const updated = {
    name: 'bar'
  }

  await writer.update(updated)

  const swarmB = new Hyperswarm(testnet)
  const corestoreB = new Corestore(RAM)

  await writer.ready() // await swarm announcement to be done

  const reader = new SlashtagsProfile({
    swarm: swarmB,
    corestore: corestoreB,
    key: writer.key
  })

  const resolved = await reader.read()

  t.alike(resolved, updated, 'read profile data from swarm successfully')

  await writer.delete()

  const afterDelete = await writer.read()
  t.is(afterDelete, null, 'deleted profile locally')

  await new Promise(resolve => reader._drive.core.on('append', resolve)) // Await delete operation to be pushed

  const afterDeleteReader = await reader.read()
  t.is(afterDeleteReader, null, 'deleted profile at reader')

  await swarmA.destroy()
  await swarmB.destroy()
})

test('close', async (t) => {
  const swarm = new Hyperswarm()
  const corestore = new Corestore(RAM)

  const profile = new SlashtagsProfile({
    swarm,
    corestore: corestore.namespace('foo')
  })

  await profile.close()

  t.ok(profile._drive.core.closed, 'close underlying drive db core')
  t.ok(profile._drive.blobs.core.closed, 'close underlying drive blobs core')

  await swarm.destroy()
})

/**
 *
Createprofile(profileObj)
Used to create a slashtags profile
readProfile(uri)
Given a Slashtags URI, retrieve the profile
updateProfile(profile)
Given an instance of a profile, update it's drive
deleteProfile
We don't have a concept of profile deleting in Bitkit right now?
We need to be able to signal to seeder to stop seeding a profile?
 */
