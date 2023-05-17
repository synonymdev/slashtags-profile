const b4a = require('b4a')
const SlashURL = require('@synonymdev/slashtags-url')
const CoreData = require('@synonymdev/slashtags-core-data')

const PROFILE_PATH = '/public/profile.json'

class SlashtagsProfile {
  /**
   * @param {CoreData} [coreData]
   */
  constructor (coreData) {
    this.coreData = coreData || new CoreData()
  }

  /**
   * Url of the author slashtag of this profile `slash:<public key>`
   */
  get url () {
    return this.coreData.url
  }

  /**
   * Absolute for the profile path
   *
   * @returns {string}
   */
  static get path () {
    return PROFILE_PATH
  }

  /**
   * await for interal coreData instance to be ready
   *
   * @returns {Promise<void>}
   */
  ready () {
    return this.coreData.ready()
  }

  /**
   * Create a new Profile file.
   *
   * @param {Profile} profile
   * @param {Parameters<CoreData['create']>[2]} opts
   *
   * @returns {Promise<void>}
   */
  create (profile, opts = {}) {
    return this.coreData.create(PROFILE_PATH, encode(profile), opts)
  }

  /**
   * Update Profile file.
   *
   * @param {Profile} profile
   * @param {Parameters<CoreData['update']>[2]} opts
   *
   * @returns {Promise<void>}
   */
  update (profile, opts = {}) {
    return this.coreData.update(PROFILE_PATH, encode(profile), opts)
  }

  /**
   * Delete Profile file.
   *
   * @param {Parameters<CoreData['delete']>[1]} opts
   *
   * @returns {Promise<void>}
   */
  delete (opts = {}) {
    return this.coreData.delete(PROFILE_PATH, opts)
  }

  /**
   * Return local Profile file
   *
   * @returns {Promise<Profile | null>}
   */
  async read () {
    const buf = await this.coreData.read(PROFILE_PATH)

    return buf && decode(buf)
  }

  /**
   * Return local Profile file
   *
   * @param {string} url - remote slashtag url `slash:<key>/`
   * @param {Parameters<CoreData['readRemote']>[1]} opts
   *
   * @returns {Promise<Profile | null>}
   */
  async readRemote (url, opts = {}) {
    const parsed = SlashURL.parse(url)
    const target = 'slash:' + parsed.id + PROFILE_PATH
    const buf = await this.coreData.readRemote(target, opts)

    return buf && decode(buf)
  }

  /**
   * Close core data instance
   *
   * @returns {Promise<void>}
   */
  close () {
    return this.coreData.close()
  }
}

module.exports = SlashtagsProfile

/**
 * Encode profile json into Uint8Array.
 *
 * @param {Profile} profile
 *
 * @returns {Uint8Array}
 */
function encode (profile) {
  return b4a.from(JSON.stringify(profile))
}

/**
 * Try to decode Uint8Array into profile json.
 *
 * @param{Uint8Array} buf
 *
 * @returns {Profile | null}
 */
function decode (buf) {
  try {
    return JSON.parse(b4a.toString(buf))
  } catch {
    return null
  }
}

/**
 * @typedef {{url: string, title: string}} Link
 * @typedef {{
 *  name?: string;
 *  bio?: string;
 *  image?: string;
 *  links?: Array<Link>;
 * }} Profile
 */
