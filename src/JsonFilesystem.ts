import Fuse from 'fuse-native';

import { Filesystem, Stat } from './Filesystem';
import { Directory } from './Directory';
import { File } from './File';

function stat(st: any) {
  return {
    mtime: st.mtime || new Date(),
    atime: st.atime || new Date(),
    ctime: st.ctime || new Date(),
    size: st.size !== undefined ? st.size : 0,
    mode: st.mode === 'dir' ? 16877 : (st.mode === 'file' ? 33188 : (st.mode === 'link' ? 41453 : st.mode)),
    uid: st.uid !== undefined ? st.uid : process.getuid(),
    gid: st.gid !== undefined ? st.gid : process.getgid()
  }
}

export const splitPath = (path: string) => {
  const lastSlash = path.lastIndexOf('/');

  if (lastSlash < 0)
    return [];

  return [
    lastSlash === 0 ? '/' : path.slice(0, lastSlash),
    lastSlash + 1 === path.length ? undefined : path.slice(lastSlash + 1),
  ] as const;
};

export class JsonFilesystem implements Filesystem {

  private fds: (File | Directory | null)[] = [null, null, null];

  constructor(private root = new Directory()) {}

  private _getOpenEntry(path: string, fd: number) {
    const entry = this.fds[fd];

    if (!entry || entry.path !== path)
      throw Fuse.EBADF;

    return entry;
  }

  private _getOpenFile(path: string, fd: number) {
    const entry = this._getOpenEntry(path, fd);

    if (!File.isFile(entry))
      throw Fuse.EBADF;

    return entry;
  }

  private _getOpenDirectory(path: string, fd: number) {
    const entry = this._getOpenEntry(path, fd);

    if (!Directory.isDirectory(entry))
      throw Fuse.EBADF;

    return entry;
  }

  init() {}

  flush(path: string, fd: number) {
    this._getOpenEntry(path, fd);
  }

  readdir(path: string) {
    const entry = this.root.getEntry(path);

    // TODO: remove non-null assertion
    if (Directory.isDirectory(entry))
      return entry.entries.map(({ name }) => name!);

    throw Fuse.ENOENT;
  }

  truncate(path: string, size: number) {
    const entry = this.root.getEntry(path);

    if (Directory.isDirectory(entry))
      throw Fuse.EISDIR;

    if (!File.isFile(entry))
      throw Fuse.ENOENT;

    entry.truncate(size);

    return 0;
  }

  getattr(path: string): Stat | undefined {
    const entry = this.root.getEntry(path);

    if (Directory.isDirectory(entry))
      return stat({ mode: 'dir', size: 4096 });

    if (File.isFile(entry))
      return stat({ mode: 'file', size: entry.size });

    throw Fuse.ENOENT;
  }

  setxattr(path: string, name: string, value: string, position: number, flags: string) {

  }

  getxattr(path: string, name: string, position: number) {
    return '';
  }

  listxattr(path: string) {
    return [];
  }

  removexattr(path: string, name: string) {

  }

  open(path: string, flags: string) {
    const entry = this.root.getEntry(path);

    if (Directory.isDirectory(entry))
      throw Fuse.EISDIR;

    if (File.isFile(entry)) {
      this.fds.push(entry);
      return this.fds.length - 1;
    }

    throw Fuse.ENOENT;
  }

  opendir(path: string, flags: string) {
    const entry = this.root.getEntry(path);

    if (!Directory.isDirectory(entry))
      throw Fuse.ENOTDIR;

    this.fds.push(entry);
    return this.fds.length - 1;
  }

  release(path: string, fd: number) {
    if (!this._getOpenEntry(path, fd))
      throw Fuse.EBADF;

    delete this.fds[fd];
  }

  releasedir(path: string, fd: number) {
    if (!this._getOpenDirectory(path, fd))
      throw Fuse.EBADF;

    delete this.fds[fd];
  }

  create(path: string, mode: number) {
    // TODO
  }

  read(path: string, fd: number, buf: Buffer, len: number, pos: number) {
    return this._getOpenFile(path, fd).read(buf, len, pos);
  }

  write(path: string, fd: number, buf: Buffer, len: number, pos: number) {
    return this._getOpenFile(path, fd).write(buf, len, pos);
  }

  mkdir(path: string, mode: number) {
    const entry = this.root.getEntry(path);

    if (entry)
      throw Fuse.EEXIST;

    const [dirname, filename] = splitPath(path);

    if (!dirname || !filename)
      throw Fuse.ENOENT;

    const dir = this.root.getEntry(dirname);

    if (!Directory.isDirectory(dir))
      throw Fuse.ENOTDIR;

    dir.addDirectory(filename);

    return 0;
  }

}
