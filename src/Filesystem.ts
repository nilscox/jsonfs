const Fuse = require('fuse-native');

export type Stat = {
  mtime: Date,
  atime: Date,
  ctime: Date,
  size: number,
  mode: number,
  uid: number,
  gid: number,
}

const methods = [
  'init',
  'flush',
  'readdir',
  'truncate',
  'getattr',
  'setxattr',
  'getxattr',
  'listxattr',
  'removexattr',
  'open',
  'opendir',
  'release',
  'releasedir',
  'read',
  'write',
  'mkdir',
  'create',
] as const;

const unimplementedOps = {
  init: () => { throw new Error('init: not implemented.'); },
  access: () => { throw new Error('access: not implemented.'); },
  statfs: () => { throw new Error('statfs: not implemented.'); },
  getattr: () => { throw new Error('getattr: not implemented.'); },
  fgetattr: () => { throw new Error('fgetattr: not implemented.'); },
  flush: () => { throw new Error('flush: not implemented.'); },
  fsync: () => { throw new Error('fsync: not implemented.'); },
  fsyncdir: () => { throw new Error('fsyncdir: not implemented.'); },
  readdir: () => { throw new Error('readdir: not implemented.'); },
  truncate: () => { throw new Error('truncate: not implemented.'); },
  ftruncate: () => { throw new Error('ftruncate: not implemented.'); },
  readlink: () => { throw new Error('readlink: not implemented.'); },
  chown: () => { throw new Error('chown: not implemented.'); },
  chmod: () => { throw new Error('chmod: not implemented.'); },
  mknod: () => { throw new Error('mknod: not implemented.'); },
  setxattr: () => { throw new Error('setxattr: not implemented.'); },
  getxattr: () => { throw new Error('getxattr: not implemented.'); },
  listxattr: () => { throw new Error('listxattr: not implemented.'); },
  removexattr: () => { throw new Error('removexattr: not implemented.'); },
  open: () => { throw new Error('open: not implemented.'); },
  opendir: () => { throw new Error('opendir: not implemented.'); },
  read: () => { throw new Error('read: not implemented.'); },
  write: () => { throw new Error('write: not implemented.'); },
  release: () => { throw new Error('release: not implemented.'); },
  releasedir: () => { throw new Error('releasedir: not implemented.'); },
  create: () => { throw new Error('create: not implemented.'); },
  utimens: () => { throw new Error('utimens: not implemented.'); },
  unlink: () => { throw new Error('unlink: not implemented.'); },
  rename: () => { throw new Error('rename: not implemented.'); },
  link: () => { throw new Error('link: not implemented.'); },
  symlink: () => { throw new Error('symlink: not implemented.'); },
  mkdir: () => { throw new Error('mkdir: not implemented.'); },
  rmdir: () => { throw new Error('rmdir: not implemented.'); },
};

const asyncHandlers = (handlers: { [key in typeof methods[number]]: Function }) => {
  return methods.reduce((obj, name) => ({
    ...unimplementedOps,
    ...obj,
    [name]: async (...args: any[]) => {
      const cb = args[args.length - 1];

      try {
        cb(0, await handlers[name](...args.slice(0, args.length - 1)));
      } catch (e) {
        if (typeof e === 'number')
          cb(e);
        else {
          cb(Fuse.ECANCELED);
          throw e;
        }
      }
    },
  }), {} as { [key in typeof methods[number]]: Function });
};

export interface Filesystem {
  init(): void | Promise<void>;
  flush(path: string, fd: number): void | Promise<void>;
  readdir(path: string): string[] | Promise<string[]>;
  truncate(path: string, size: number): number | Promise<number>;
  getattr(path: string): Stat | undefined | Promise<Stat | undefined>;
  setxattr(path: string, name: string, value: string, position: number, flags: string): void | Promise<void>;
  getxattr(path: string, name: string, position: number): string | Promise<string>;
  listxattr(path: string): string[] | Promise<string[]>;
  removexattr(path: string, name: string): void | Promise<void>;
  open(path: string, flags: string): number | Promise<number>;
  opendir(path: string, flags: string): number | Promise<number>;
  release(path: string, fd: number): void | Promise<void>;
  releasedir(path: string, fd: number): void | Promise<void>;
  create(path: string, mode: number): number | Promise<number>;
  read(path: string, fd: number, buf: Buffer, len: number, pos: number): number | Promise<number>;
  write(path: string, fd: number, buf: Buffer, len: number, pos: number): number | Promise<number>;
  mkdir(path: string, mode: number): number | Promise<number>;
}

export class FuseFilesystem {

  private fuse: typeof Fuse;

  constructor(mountpoint: string, handlers: Filesystem, opts?: any) {
    this.fuse = new Fuse(mountpoint, asyncHandlers(handlers), opts);
  }

  public mount() {
    return new Promise((resolve, reject) => {
      this.fuse.mount(function (err?: Error) {
        if (err)
          return reject(err);

        resolve();
      });
    });
  }

  public unmount() {
    return new Promise((resolve, reject) => {
      this.fuse.unmount((err?: Error) => {
        if (err)
          reject(err);

        resolve();
      });
    });
  }

}
