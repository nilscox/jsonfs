import Fuse from 'fuse-native';

import { Directory } from './Directory';

export class File {

  public readonly type = 'file';
  static isFile = (obj: any): obj is File => obj?.type === 'file';

  constructor(private _parent: Directory, private _name: string, private _content: Buffer) {
    if (this._name?.includes('/'))
      throw new Error('File name cannot include a /');
  }

  get name() {
    return this._name;
  }

  get size() {
    return this._content.length;
  }

  get content() {
    return this._content;
  }

  get path() {
    const parentPath = this._parent.path;

    if (parentPath === '/')
      return parentPath + this._name;

    return [parentPath, this._name].join('/');
  }

  read(buf: Buffer, len: number, pos: number) {
    return this._content.copy(buf, 0, pos, pos + len);
  }

  write(buf: Buffer, len: number, pos: number) {
    const end = pos + len;

    if (end >= this._content.length) {
      const newContent = Buffer.alloc(end);

      this._content.copy(newContent, 0, 0, this._content.length);
      this._content = newContent;
    }

    return buf.copy(this._content, pos, 0, len);
  }

  truncate(size: number) {
    const newContent = Buffer.alloc(size);

    this._content.copy(newContent, 0, 0, Math.min(this._content.length, size));
    this._content = newContent;
  }

}
