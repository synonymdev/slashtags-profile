interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

// file://./node_modules/@hyperswarm/testnet/index.js
declare module '@hyperswarm/testnet' {
  import DHT from 'hyperdht'

  function createTestnet(
    nodes?: number,
    teardown?: Function,
  ): Promise<{ bootstrap: Array<{ host: string; port: number }>, nodes: DHT[] }>

  export = createTestnet
}

// file://./node_modules/hyperswarm/index.js
declare module 'hyperswarm' {
  import EventEmitter from 'events';
  import type DHT from 'hyperdht';

  class Server extends EventEmitter {
    listen: (keyPair: KeyPair) => Promise<void>;
    address: () => {
      publicKey: Uint8Array;
      host: string;
      port: number;
    };
  }

  interface Discovery {
    flushed(): Promise<void>;
    topic: Uint8Array;
    isClient: boolean;
    isServer: boolean;
    destroy(): Promise<any>;
    destroyed: boolean;

    _sessions: Discovery[]
    _clientSessions: number;
    _serverSessions: number;
  }

  interface PeerInfo {
    publicKey: Uint8Array,
    topics: Uint8Array[]
  }

  class hyperswarm extends EventEmitter {
    constructor(opts?: any);
    server: Server;
    peers: Map<string, any>;
    keyPair: KeyPair;
    dht: DHT;
    listening?: Promise<void>;
    destroyed: boolean;


    status(topic: Uint8Array): Discovery | undefined;
    topics(): IterableIterator<Discovery>;
    listen(): Promise<undefined>;
    destroy(): Promise<undefined>;
    joinPeer(key: Uint8Array): undefined;
    leave(topic: Uint8Array): Promise<any>;
    join(
      discoveryKey: Uint8Array,
      options?: { server?: boolean; client?: boolean },
    ): Discovery;
    flush(): Promise<undefined>;

    on(event: 'connection', listener: (connection: any, peerInfo: PeerInfo) => any): this
  }

  export = hyperswarm
}

// file://./node_modules/hyperdht/index.js
declare module 'hyperdht' {
  import type EventEmitter from 'events'
  import type SecretStream from '@hyperswarm/secret-stream';

  interface Server extends EventEmitter {
    listen: (keyPair?: KeyPair) => Promise<void>
    address(): { host: string, port: number, publicKey: Uint8Array }
    close(): Promise<void>
    closed: boolean
  }

  interface Node {
    host: string,
    port: number
  }

  class DHT {
    constructor(opts?: { bootstrap?: Array<Node>, keyPair?: KeyPair })
    static keyPair(): KeyPair;

    defaultKeyPair: KeyPair
    destroyed: boolean
    bootstrapNodes: Node[]

    listening: Set<Server>

    connect(publicKey: Uint8Array, opts?: { keyPair?: KeyPair }): SecretStream;
    destroy(): Promise<void>
    ready(): Promise<void>
    createServer(onconnection?: (socket: SecretStream) => void): Server
  }

  export = DHT
}
// file://./node_modules/@hyperswarm/secret-stream/index.js
declare module '@hyperswarm/secret-stream' {
  import { Duplex } from 'stream'

  class SecretStream extends Duplex {
    publicKey: Uint8Array;
    remotePublicKey: Uint8Array;
    /** Shared secret unique to each connection after noise handshake */
    handshakeHash: Uint8Array;

    opened: Promise<boolean>;

    destroy(): this
  }

  export = SecretStream
}

// file://./node_modules/corestore/index.js
declare module 'corestore' {
  import Hypercore, { KeyPair } from 'hypercore';
  import { Encoding, string } from 'compact-encoding';

  class Corestore {
    constructor(
      storage: any,
      opts?: {
        primaryKey?: Uint8Array;
        [key: string]: any
      },
    );

    primaryKey: Uint8Array;
    _root: Corestore;
    _namespace: Uint8Array;
    _preready: (core?: Hypercore) => any
    _preload: (opts: any) => Promise<{
      from: Hypercore,
      keyPair?: KeyPair,
      encryptionKey?: Uint8Array | undefined
    }>
    _closing: null | Promise<any>;
    _preready: (core: Hypercore) => Promise<void>
    storage: any;

    ready(): Promise<void>
    replicate(socket: Duplex, opts?: any);
    namespace(name?: string | Uint8Array): Corestore;
    close(): Promise<void>;
    session(opts?: { primaryKey?: Uint8Array, namespace?: string | null }): Corestore

    createKeyPair(name: string): Promise<KeyPair>;
    findingPeers(): () => void;

    get(opts: {
      name?: string;
      key?: Uint8Array;
      encryptionKey?: Uint8Array;
      keyPair?: {
        secretKey: Uint8Array;
        publicKey: Uint8Array;
        auth?: Hypercore['auth']
      };
      secretKey?: Uint8Array;
      cache?: boolean;
      onwait?: Hypercore['onwait'];
      valueEncoding?: string | Encoding;
      preload?: () => any;
    }): Hypercore;
  };

  export = Corestore
}

// file://./node_modules/hyperdrive/index.js
declare module 'hyperdrive' {
  import Hypercore from 'hypercore';
  import Hyperbee from 'hyperbee';
  import Corestore from 'corestore';
  import EventEmitter from 'events';
  import Hyperblobs from 'hyperblobs';
  import { Readable } from 'stream'

  class HyperDrive extends EventEmitter {
    constructor(
      store: Corestore,
      options?: {
        _db?: Hyperbee;
        _files?: Hyperbee;
        onwait?: (seq: number, core: Hypercore) => any;
        encryptionKey?: Uint8Array
      },
    );
    constructor(
      store: Corestore,
      key: Uint8Array,
      options?: {
        _db?: Hyperbee;
        _files?: Hyperbee;
        onwait?: (seq: number, core: Hypercore) => any;
        encryptionKey?: Uint8Array
      },
    );

    blobs?: Hyperblobs;
    db: Hyperbee;
    files: Hyperbee;
    /**
     * Instance of [Corestore](https://github.com/hypercore-protocol/corestore-next/blob/master/index.js)
     */
    corestore: Corestore;
    /**
     * Promise that resolves once the drive is fully open and emits 'ready'.
     */
    opening: Promise<void>;
    /**
     * Boolean set to true once 'ready' is emitted.
     */
    opened: boolean;

    /**
     * The public key of the Hypercore backing the drive.
     */
    key: Uint8Array;
    /**
     * The hash of the public key of the Hypercore backing the drive, can be used to seed the drive using Hyperswarm.
     */
    discoveryKey: Hypercore['discoveryKey'];
    /**
     * The public key of the Hyperblobs instance holding blobs associated with entries in the drive.
     */
    contentKey: Uint8Array;
    /**
     * The underlying Hypercore backing the drive.
     */
    core: Hypercore;
    /**
     * The version (offset in the underlying Hypercore) of the drive.
     */
    version: number;

    /**
     * Create a hook that tells Hypercore you are finding peers for this core in the background. Call done when your current discovery iteration is done. If you're using Hyperswarm, you'd normally call this after a swarm.flush() finishes.

This allows drive.update to wait for either the findingPeers hook to finish or one peer to appear before deciding whether it should wait for a merkle tree update before returning.
     */
    findingPeers(): Hypercore['findingPeers'];
    /**
     * Wait for the drive's core to try and find a signed update to it's length. Does not download any data from peers except for a proof of the new core length.
     */
    update: Hypercore['update'];
    /**
     * Wait for the drive to fully open. In general, you do NOT need to wait for ready unless checking a synchronous property on drive since internals await this themselves.
     */
    ready(): Promise<void>;
    /**
     * Checks out a read-only snapshot of a Hyperdrive at a particular version.
     */
    checkout(len: number): HyperDrive;
    /**
     * Atomically mutate the drive, has the same interface as Hyperdrive.
     */
    batch(): HyperDrive;
    /**
     * Atomically commit a batch of mutations to the underlying drive.
     */
    flush(): Promise<void>;
    /**
     * Close the drive and its underlying Hypercore backed datastructures.
     */
    close(): Promise<void>;
    /**
     * Returns the hyperblobs instance storing the blobs indexed by drive entries.
     */
    getBlobs(): Promise<Hyperblobs>;
    /**
     * Returns the blob at path in the drive. Internally, Hyperdrive contains a metadata index of entries that "point" to offsets in a Hyperblobs instance. Blobs themselves are accessible via drive.get(path), whereas entries are accessible via drive.entry(path). If no blob exists at path, returns null.
     */
    get(path: string): Promise<Uint8Array>;
    /**
     * Sets the blob in the drive at path.
     */
    put(
      path: string,
      buf: Uint8Array,
      opts?= { executable?: boolean, metadata?: any },
    ): ReturnType<Hyperbee['put']>;
    /**
     * Removes the entry at path from the drive. If a blob corresponding to the entry at path exists, it is not currently deleted.
     */
    del(path: string): ReturnType<Hyperbee['del']>;
    /**
     *Creates an entry in drive at path that points to the entry at linkname. Note, if a blob entry currently exists at path then drive.symlink(path, linkname) will overwrite the entry and drive.get(path) will return null, while drive.entry(path) will return the entry with symlink information.
     */
    symlink(path: string, dst: string, opts?: { metadata: any });
    /**
     *
     * Returns the entry at path in the drive. An entry holds metadata about a path.
     */
    entry(path: string): ReturnType<Hyperbee['get']> | Promise<void>;
    /**
     * Returns a read stream of entries in the drive.
     */
    entries: Hyperbee['createReadStream']
    /**
     * Returns a stream of all entries in the drive at paths prefixed with folder. 
     */
    list(folder: string, options?: { recursive: boolean }): ReturnType<Hyperbee['createReadStream']>
    /**
     * Returns a stream of all subpaths of entries in drive stored at paths prefixed by folder.
    */
    readdir(folder): Hyperbee.IteratorStream<string>

    _onwait: Hypercore['onwait'];
    _openBlobsFromHeader(opts?: { wait: boolean }): Promise<Hyperblobs>;

    on(event: 'close', listener: () => any): this;
    on(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
    once(event: 'ready', listener: () => any): this;
    once(event: 'close', listener: () => any): this;
    once(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
    removeListener(event: 'ready', listener: () => any): this;
    removeListener(event: 'close', listener: () => any): this;
    removeListener(event: 'blobs', listener: (blobs: Hyperblobs) => any): this;
  };

  export = HyperDrive
}
