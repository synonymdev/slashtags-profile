# slashtags-profile

Slashtags Profile helper module.

## Install

```bash
npm install @synonymdev/slashtags-profile
```

## Usage

Initialize

```js
const { Client } = require('@synonymdev/web-relay')
const SlashtagsProfile = require('@synonymdev/slashtags-profile')

const client = new Client({ storage: "path/to/storage", relay: address })
const writer = new SlashtagsProfile(client)

const profile = { name: 'foo' }

await writer.put(profile)

const url = await writer.createURL()
```

Resolve profile as a reader 

```js
const { Client } = require('@synonymdev/web-relay')
const SlashtagsProfile = require('@synonymdev/slashtags-profile')

const client = new Client({ storage: "path/to/storage "})
const reader = new SlashtagsProfile(client)

const resolved = await reader.get(url) // URL from writer side
// {name: 'foo'}
```

## API

#### `const profile = new SlashtagsProfile(WebRelayClient)`

Create a new SlashtagsProfile instance.

- `WebRelayClient` [slashtags-web-relay](https://github.com/slashtags/web-relay) instance.

#### `const url = await profile.createURL()`

Creates a sharable `url` to allow remote readers to read this profile.

#### `await profile.close()`

Closes the underlying web relay client.

#### `await profile.put(profile)`

Puts a new profile value. `profile` param should be an object following its type definition.

#### `await profile.del()`

Deletes the value from the underlying hyperdrive.

####  `await profile.get([url])`

Read a local profile if no `url` is passed, or a remote one if `url` is passed.

#### `await profile.subscribe(url, onupdate)`

Watch updates to a remote file, and call `onupdate(profile)` function with current profile.
