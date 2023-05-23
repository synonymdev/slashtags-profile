const b4a = require('b4a')
const SlashURL = require('@synonymdev/slashtags-url')
const CoreData = require('@synonymdev/slashtags-core-data')
const { default: Ajv } = require('ajv')

const PROFILE_PATH = '/public/profile.json'
const PROFILE_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Profile',
  type: 'object',
  properties: {
    name: {
      type: 'string'
    },
    bio: {
      type: 'string'
    },
    image: {
      type: 'string'
    },
    links: {
      type: 'array',
      items: {
        $ref: '#/definitions/Link'
      }
    }
  },
  definitions: {
    Link: {
      type: 'object',
      properties: {
        url: {
          type: 'string'
        },
        title: {
          type: 'string'
        }
      },
      required: ['title', 'url']
    }
  }
}

const ajv = new Ajv({ allErrors: true })
const _validate = ajv.compile(PROFILE_SCHEMA)

class SlashtagsProfile {
  /**
   * @param {CoreData | {bootstrap?: {host: string, port:number}[]}} [coreData]
   */
  constructor (coreData) {
    if (coreData instanceof CoreData) {
      this.coreData = coreData
    } else {
      // For testing purposes, we allow passing options to the CoreData constructor
      const opts = coreData
      this.coreData = new CoreData(opts)
    }
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
    validate(profile)
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
    validate(profile)
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
   * Subscribe to updates to a local or remote profile file.
   *
   * @param {string} url
   * @param {(curr: Profile, prev: Profile) => any} onupdate
   *
   * @returns {Promise<() => void>}
   */
  subscribe (url, onupdate) {
    const parsed = SlashURL.parse(url)
    const target = 'slash:' + parsed.id + PROFILE_PATH

    return this.coreData.subscribe(target, (curr, prev) => {
      onupdate(curr && decode(curr), prev && decode(prev))
    })
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
 * Validate profile json.
 *
 * @param {Profile} profile
 */
function validate (profile) {
  const valid = _validate(profile)
  if (!valid) {
    const message = _validate.errors.map((error) => {
      const name = error.instancePath === '' ? 'profile' : `Field '${error.instancePath.slice(1)}'`
      return ` - ${name} ${error.message}`
    })
      .join('\n')
    throw new Error('Invalid profile:\n' + message)
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
