const Hyperdrive = require('hyperdrive')
const b4a = require('b4a')

class SlashtagsProfile {
  /**
   * @param {object} opts
   * @param {object} opts.corestore - Corestore instance, namespaced to generate a unique Hyperdrive
   * @param {Hyperswarm} [opts.swarm]
   * @param {Uint8Array} [opts.key]
   * @param {Uint8Array} [opts.keyPair]
   */
  constructor (opts) {
    this._swarm = opts.swarm
    this._corestore = opts.corestore

    this._swarm?.on('connection', (socket) => {
      this._corestore.replicate(socket)
    })

    this._drive = new Hyperdrive(this._corestore, opts.key)

    this._opened = this._open()

    if (opts.key) {
      this._drive.ready().then(() => {
        // If we joining as readers, we need to tell hypercore internals
        // ot await finding peers before resolving this._drive.update() in read().
        const done = this._drive.findingPeers()
        this._swarm?.flush().then(done, done)
      })
    }
  }

  // Announce hyperdrive on the swarm
  async _open () {
    await this._drive.ready()
    const discovery = this._swarm?.join(this._drive.discoveryKey)

    if (this._drive.core.writable) {
      return discovery.flushed()
    }
  }

  async ready () {
    return this._opened
  }

  get key () {
    return this._drive.key
  }

  /**
   * @param {Profile} data
   */
  create (data) {
    return this.update(data)
  }

  /**
   * @param {Profile} data
   */
  update (data) {
    return this._drive.put('/profile.json', b4a.from(JSON.stringify(data)))
  }

  /**
   * @returns {Promise<Profile>}
   */
  async read () {
    if (!this._drive.core.writable) await this.ready()

    return this._drive.get('/profile.json')
      .then(buf => buf && b4a.toString(buf))
      .then(JSON.parse)
  }

  delete () {
    return this._drive.del('/profile.json')
  }

  close () {
    return this._drive.close()
  }
}

module.exports = SlashtagsProfile

/**
 * @typedef {import('hyperswarm')} Hyperswarm
 * @typedef {{url: string, title: string}} Link
 * @typedef {{
 *  name?: string;
 *  bio?: string;
 *  image?: string;
 *  links?: Array<Link>;
 * }} Profile
 */
