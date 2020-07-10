import { File } from './File';

export class Directory {

  public readonly type = 'directory';
  static isDirectory = (obj: any): obj is Directory => obj?.type === 'directory';

  private _entries: (Directory | File)[] = [];

  constructor(private _parent?: Directory, private _name?: string) {
    if (this._name?.includes('/'))
      throw new Error('Directory name cannot include a /');
  }

  get entries() {
    return this._entries;
  }

  get directories() {
    return this._entries.filter(Directory.isDirectory);
  }

  get files() {
    return this._entries.filter(File.isFile);
  }

  get name() {
    return this._name;
  }

  get path(): string {
    if (!this._parent)
      return '/';

    return this._parent.path + this._name;
  }

  private _find(name: string) {
    return this._entries.find(entry => entry.name === name);
  }

  private _getEntry(path: string[]): Directory | File | undefined {
    if (path.length === 0)
      return this;

    const entry = this._find(path[0]);

    if (Directory.isDirectory(entry))
      return entry._getEntry(path.slice(1));

    if (path.length === 1 && path[0] === entry?.name)
      return entry;
  }

  getEntry(path: string) {
    if (path[0] !== '/')
      throw new Error('Path must be absolute');

    if (path === '/' && !this._parent)
      return this;

    return this._getEntry(path.split('/').slice(1));
  }

  addDirectory(name: string) {
    if (this._find(name))
      throw new Error('EEXIST');

    const dir = new Directory(this, name);

    this._entries.push(dir);

    return dir;
  }

  addFile(name: string, content: Buffer) {
    if (this._find(name))
      throw new Error('EEXIST');

    const file = new File(this, name, content);

    this._entries.push(file);

    return file;
  }

}
