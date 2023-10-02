const b4a = require('b4a')
const { default: Ajv } = require('ajv')

const PROFILE_PATH = '/profile.json'
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
   * @param {WebRelayClient} client
   */
  constructor (client) {
    this._client = client
  }

  /**
   * Create a url of the profile file
   */
  async createURL () {
    return this._client.createURL(PROFILE_PATH)
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
   * Create or update a Profile file.
   *
   * @param {Profile} profile
   * @param {Parameters<import('@synonymdev/web-relay').Client['put']>[2]} [options]
   *
   * @returns {Promise<void>}
   */
  put (profile, options) {
    validate(profile)
    return this._client.put(PROFILE_PATH, encode(profile), options)
  }

  /**
   * Delete Profile file.
   * @param {Parameters<import('@synonymdev/web-relay').Client['del']>[1]} [options]
   *
   * @returns {Promise<void>}
   */
  del (options) {
    return this._client.del(PROFILE_PATH, options)
  }

  /**
   * Return local Profile file
   *
   * @param {string} [url]
   * @param {Parameters<import('@synonymdev/web-relay').Client['get']>[1]} [options]
   *
   * @returns {Promise<Profile | null>}
   */
  async get (url, options) {
    const buf = url
      ? await this._client.get(url, options)
      : await this._client.get(PROFILE_PATH, options)

    return buf && decode(buf)
  }

  /**
   * Subscribe to updates to a local or remote profile file.
   *
   * @param {string} url
   * @param {(curr: Profile) => any} onupdate
   *
   * @returns {() => void}
   */
  subscribe (url, onupdate) {
    return this._client.subscribe(url, (buf) => {
      onupdate(buf && decode(buf))
    })
  }

  /**
   * Close core data instance
   *
   * @returns {Promise<void>}
   */
  close () {
    return this._client.close()
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
 *
 * @typedef {import('@synonymdev/web-relay/types/lib/client/index')} WebRelayClient
 */
