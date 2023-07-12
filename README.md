# slashtags-profile

A helper module for creating Slashtags profiles.

## Install

```bash
npm install @synonymdev/slashtags-profile
```

## Usage

Initialize

```js
const SlashtagsProfile = require('@synonymdev/slashtags-profile')

const writer = new SlashtagsProfile()
await writer.ready()

const profile = { name: 'foo' }

await writer.create(profile)
```

Resolve the profile as a reader 

```js
const SlashtagsProfile = require('@synonymdev/slashtags-profile')

const reader = new SlashtagsProfile()

const resolved = await reader.readRemote(writer.url)
// {name: 'foo'}
```

## API

#### `new SlashtagsProfile([coreData])`

Create a new SlashtagsProfile instance.

- `coreData` Optional [slashtags-core-data](https://www.npmjs.com/package/@synonymdev/slashtags-core-data) module; if not passed, one will be created with a random KeyPair.

#### `await profile.ready()`

Await for the underlying resources to be ready; if the profile is writable, code execution will await for the announcement on the swarm to be completed.

#### `await profile.close()`

Closes the writing sessions created for this instance.

#### `await profile.create(data)`

Same as `await profile.update(data)`

#### `await profile.update(data)`

Puts a new profile value. The `data` parameter should be an object following its type definition.

#### `await profile.delete()`

Delete the profile data from the underlying hyperdrive.

####  `await profile.read()`

Read the profile from local storage. It will internally await for finding peers if it has any. Otherwise, it will eagerly get update from connected peers. 

#### `await profile.subscribe(url, onupdate)`

Watch updates to a local or a remote profile, and call the `onupdate(curr)` function with current profile.
