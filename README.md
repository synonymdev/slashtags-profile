# slashtags-profile

Slashtags Profile helper module.

## Install

```bash
npm install @synonymdev/slashtags-profile
```

## Usage

Initialize

```js
const SlashtagsProfile = require('@synonymdev/slashtags-profile')
const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')

const swarm = new Hyperswarm()
const corestore = new Corestore(RAM)

const writer = new SlashtagsProfile({
  swarm,
  corestore: corestoreA.namespace('foo'),
})

await writer.ready()
console.log(writer.key)

const profile = { name: 'foo' }

await writer.create(profile)
```

Resolve profile as a reader 

```js
const SlashtagsProfile = require('@synonymdev/slashtags-profile')
const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')

const reader = new SlashtagsProfile({
  swarm,
  corestore: corestoreB,
  key, // Key from the writer
})

const resolved = await reader.read()
// {name: 'foo'}
```

## API

#### `new SlashtagsProfile(opts)`

Create a new SlashtagsProfile instance.

`options` is an object that includes:

- `swarm` [Hyperswarm](https://github.com/holepunchto/hyperswarm) instance
- `corestore` [Corestore](https://github.com/holepunchto/corestore) instance, it should be uniquely [namespaced](https://github.com/holepunchto/corestore#const-store--storenamespacename), to avoid overwriting other profiles.
- `key` Optional key to create a read only instance

#### `await profile.ready()`

Await for the underlying resources to be ready, if the profile is writable, it will await for the announcement on the swarm to be done.

#### `await profile.close()`

Closes Hypercore sessions created for this instance.

#### `await profile.create(data)`

Same as `await profile.update(data)`

#### `await profile.update(data)`

Puts a new profile value. `data` param should be an object following its type definition.

#### `await profile.delete()`

Deletes the value from the underlying hyperdrive.

####  `await profile.read()`

Read the profile from local storage. It will internally await for finding peers if it has any. Otherwise, it will eagerly get update from connected peers. 
