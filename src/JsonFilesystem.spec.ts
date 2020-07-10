import Fuse from 'fuse-native';
import { expect } from 'chai';

import { Directory } from './Directory';
import { File } from './File';
import { JsonFilesystem } from './JsonFilesystem';

type NestedStringObject = {
  [key: string]: NestedStringObject | string;
};

const makeFilesystem = (obj: NestedStringObject, dir?: Directory) => {
  const makeDirectory = (root: Directory, obj: NestedStringObject) => {
    for (const [name, entry] of Object.entries(obj)) {
      if (typeof entry === 'string')
        root.addFile(name, Buffer.from(entry));
      else
        makeDirectory(root.addDirectory(name), entry);
    }

    return root;
  };

  return new JsonFilesystem(makeDirectory(dir || new Directory(), obj));
}

describe('makeFilesystem', () => {
  it('should make a filesystem from an object', () => {
    const fs = makeFilesystem({ foo: { bar: { 'a.txt': 'a' } }, 'file.txt': 'hello' });
    const dir = (fs as any).root;

    expect(dir.files).to.have.length(1);
    expect(dir.files[0]).to.have.property('size', 5);

    expect(dir.directories).to.have.length(1);
    expect(dir.directories[0].directories).to.have.length(1);
    expect(dir.directories[0].directories[0].files).to.have.length(1);
    expect(dir.directories[0].directories[0].files[0]).to.have.property('size', 1);
  });
});

describe('JsonFilesystem', () => {

  describe('readdir', () => {

    it('should throw ENOENT when the path does not refer to an existing directory', () => {
      const fs = makeFilesystem({ 'file.txt': '' });

      expect(() => fs.readdir('/whoops')).to.throw().that.eql(Fuse.ENOENT);
      expect(() => fs.readdir('/file.txt')).to.throw().that.eql(Fuse.ENOENT);
    });

    it('should list entries in an empty filesystem', () => {
      const fs = new JsonFilesystem();

      const result = fs.readdir('/');

      expect(result).to.have.length(0);
    });

    it('should list entries in a filesystem', () => {
      const fs = makeFilesystem({ foo: {}, 'file.txt': 'hello' });

      const result = fs.readdir('/');

      expect(result).to.have.length(2);
      expect(result[0]).to.eql('foo');
      expect(result[1]).to.eql('file.txt');
    });

    it('should list entries in a filesystem sub-directory', () => {
      const fs = makeFilesystem({ foo: { bar: {}, 'file.txt': 'hello' } });

      const result = fs.readdir('/foo');

      expect(result).to.have.length(2);
      expect(result[0]).to.eql('bar');
      expect(result[1]).to.eql('file.txt');
    });

  });

  describe('getattr', () => {

    it('should throw ENOENT when the path does not refer to an existing entry', () => {
      const fs = makeFilesystem({ foo: {} });

      expect(() => fs.getattr('/file.txt')).to.throw().that.eql(Fuse.ENOENT);
      expect(() => fs.getattr('/foo/bar')).to.throw().that.eql(Fuse.ENOENT);
    });

    it('should return a directory attributes', () => {
      const fs = makeFilesystem({ foo: {} });

      const result = fs.getattr('/foo');

      expect(result).to.have.property('mtime');
      expect(result).to.have.property('atime');
      expect(result).to.have.property('ctime');
      expect(result).to.have.property('size', 4096);
      expect(result).to.have.property('mode', 0o40755);
      expect(result).to.have.property('uid');
      expect(result).to.have.property('gid');
    });

    it('should return a file attributes', () => {
      const fs = makeFilesystem({ 'file.txt': 'hello' });

      const result = fs.getattr('/file.txt');

      expect(result).to.have.property('mtime');
      expect(result).to.have.property('atime');
      expect(result).to.have.property('ctime');
      expect(result).to.have.property('size', 5);
      expect(result).to.have.property('mode', 0o100644);
      expect(result).to.have.property('uid');
      expect(result).to.have.property('gid');
    });

  });

  describe('open', () => {

    it('should throw ENOENT when the path does not refer to an existing entry', () => {
      const fs = makeFilesystem({});

      expect(() => fs.open('/foo', 'r')).to.throw().that.eql(Fuse.ENOENT);
    });

    it('should throw EISDIR when requesting to open directory', () => {
      const fs = makeFilesystem({ foo: {} });

      expect(() => fs.open('/foo', 'r')).to.throw().that.eql(Fuse.EISDIR);
    });

    it('should open a file', () => {
      const fs = makeFilesystem({ 'file.txt': '' });

      const result = fs.open('/file.txt', 'r');

      expect(result).to.be.greaterThan(0);
    });

  });

  describe('release', () => {

    it('should throw EBADF when the file descriptor does not refer to the correct path', () => {
      const fs = makeFilesystem({ 'file.txt': '' });
      const fd = fs.open('/file.txt', 'r');

      expect(() => fs.release('/foo', fd)).to.throw().that.eql(Fuse.EBADF);
      expect(() => fs.release('/file.txt', fd + 1)).to.throw().that.eql(Fuse.EBADF);
    });

    it('should release a file', () => {
      const fs = makeFilesystem({ 'file.txt': '' });
      const fd = fs.open('/file.txt', 'r');

      const result = fs.release('/file.txt', fd);

      expect(result).to.eql(0);
      expect(() => fs.release('/file.txt', fd)).to.throw().that.eql(Fuse.EBADF);
    });

  });

  describe('read', () => {

    it('should throw EBADF when the file descriptor does not refer to the correct path', () => {
      const fs = makeFilesystem({ 'file.txt': '' });
      const fd = fs.open('/file.txt', 'r');

      expect(() => fs.read('/file.txt', fd + 1, Buffer.alloc(0), 0, 0)).to.throw().that.eql(Fuse.EBADF);
    });

    it('should read from a file', () => {
      const fs = makeFilesystem({ 'file.txt': 'hello' });
      const fd = fs.open('/file.txt', 'r');
      const buf = Buffer.alloc(16);

      const result = fs.read('/file.txt', fd, buf, 5, 0);

      expect(result).to.eql(5);
      expect(buf.slice(0, result).toString()).to.eql('hello');
    });

  });

  describe('write', () => {

    it('should throw EBADF when the file descriptor does not refer to the correct path', () => {
      const fs = makeFilesystem({ 'file.txt': '' });
      const fd = fs.open('/file.txt', 'w');

      expect(() => fs.write('/file.txt', 42, Buffer.alloc(0), 0, 0)).to.throw().that.eql(Fuse.EBADF);
    });

    it('should write to a file', () => {
      const root = new Directory();
      const fs = makeFilesystem({ 'file.txt': '' }, root);
      const file = root.getEntry('/file.txt') as File;
      const fd = fs.open('/file.txt', 'w');
      const buf = Buffer.from('hello');

      const result = fs.write('/file.txt', fd, buf, 5, 0);

      expect(result).to.eql(5);
      expect(file.content.slice(0, result).toString()).to.eql('hello');
    });

  });

  describe('mkdir', () => {

    it('should throw EEXIST when the path refers to an existing entry', () => {
      const fs = makeFilesystem({ foo: {}, 'file.txt': '' });

      expect(() => fs.mkdir('/foo', 0o40755)).to.throw().that.eql(Fuse.EEXIST);
      expect(() => fs.mkdir('/file.txt', 0o10644)).to.throw().that.eql(Fuse.EEXIST);
    });

    it('should throw ENOTDIR when the last path component is not a directory', () => {
      const fs = makeFilesystem({ foo: '' });

      expect(() => fs.mkdir('/foo/bar', 0o40755)).to.throw().that.eql(Fuse.ENOTDIR);
    });

    it('should create a directory', () => {
      const root = new Directory();
      const fs = new JsonFilesystem(root);

      const result = fs.mkdir('/foo', 0o40755);

      expect(result).to.eql(0);
      expect(root.directories).to.have.length(1);
      expect(root.directories[0]).to.have.property('name', 'foo');
    });

    it('should create a sub-directory', () => {
      const root = new Directory();
      const fs = makeFilesystem({ foo: {} }, root);

      const result = fs.mkdir('/foo/bar', 0o40755);

      expect(result).to.eql(0);
      expect(root.directories[0].directories).to.have.length(1);
      expect(root.directories[0].directories[0]).to.have.property('name', 'bar');
    });

  });

  describe('create', () => {

    it('should throw EEXIST when the path refers to an existing entry', () => {
      const fs = makeFilesystem({ foo: {}, 'file.txt': '' });

      expect(() => fs.create('/foo', 0o40755)).to.throw().that.eql(Fuse.EEXIST);
      expect(() => fs.create('/file.txt', 0o10644)).to.throw().that.eql(Fuse.EEXIST);
    });

    it('should throw ENOTDIR when the last path component is not a directory', () => {
      const fs = makeFilesystem({ foo: '' });

      expect(() => fs.create('/foo/bar', 0o40755)).to.throw().that.eql(Fuse.ENOTDIR);
    });

    it('should create a file', () => {
      const root = new Directory();
      const fs = new JsonFilesystem(root);

      const result = fs.create('/file.txt', 0o100644);

      expect(result).to.eql(0);
      expect(root.files).to.have.length(1);
      expect(root.files[0]).to.have.property('name', 'file.txt');
    });

    it('should create a file in a sub-directory', () => {
      const root = new Directory();
      const fs = makeFilesystem({ foo: {} }, root);

      const result = fs.create('/foo/file.txt', 0o100644);

      expect(result).to.eql(0);
      expect(root.directories[0].files).to.have.length(1);
      expect(root.directories[0].files[0]).to.have.property('name', 'file.txt');
    });

  });

});
