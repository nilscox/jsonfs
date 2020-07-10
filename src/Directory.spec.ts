import { expect } from 'chai';

import { Directory } from './Directory';

describe('Directory', () => {

  it('should create a new filesystem', () => {
    const root = new Directory();

    expect(root.path).to.eql('/');
    expect(root.directories).to.have.length(0);
    expect(root.files).to.have.length(0);
  });

  it('should add a file', () => {
    const root = new Directory();

    const file = root.addFile('file.txt', Buffer.from('hello'));

    expect(root.directories).to.have.length(0);
    expect(root.files).to.have.length(1);
    expect(root.files[0]).to.equal(file);

    expect(file.name).eql('file.txt');
    expect(file.size).eql(5);
    expect(file.content.toString()).eql('hello');
    expect(file.path).eql('/file.txt');
  });

  it('should add a directory', () => {
    const root = new Directory();

    const foo = root.addDirectory('foo');

    expect(root.files).to.have.length(0);
    expect(root.directories).to.have.length(1);
    expect(root.directories[0]).to.equal(foo);

    expect(foo.path).to.eql('/foo');
    expect(foo.directories).to.have.length(0);
    expect(foo.files).to.have.length(0);
  });

  it('should add a directory, then a file into it', () => {
    const root = new Directory();

    const foo = root.addDirectory('foo');
    const file = foo.addFile('file.txt', Buffer.from('hello'));

    expect(foo.files[0]).to.equal(file);

    expect(file.name).to.eql('file.txt');
    expect(file.path).to.eql('/foo/file.txt');
  });

  it('should get the root directory ', () => {
    const root = new Directory();

    const result = root.getEntry('/');

    expect(result).to.equal(root);
  });

  it('should throw if the path is not absolute ', () => {
    // TODO
  });

  it('should get a non existing entry /file.txt', () => {
    const root = new Directory();

    const result = root.getEntry('/file.txt');

    expect(result).to.be.undefined;
  });

  it('should get a non existing entry /foo/file.txt', () => {
    const root = new Directory();
    const foo = root.addDirectory('foo');

    const result = root.getEntry('/foo/file.txt');

    expect(result).to.be.undefined;
  });

  it('should get a non existing entry /foo/file.txt when foo is a file', () => {
    const root = new Directory();
    const foo = root.addFile('foo', Buffer.from(''));

    const result = root.getEntry('/foo/file.txt');

    expect(result).to.be.undefined;
  });

  it('should get a directory ', () => {
    const root = new Directory();
    const foo = root.addDirectory('foo');

    const result = root.getEntry('/foo');

    expect(result).to.equal(foo);
  });

  it('should get a file ', () => {
    const root = new Directory();
    const file = root.addFile('file.txt', Buffer.from(''));

    const result = root.getEntry('/file.txt');

    expect(result).to.equal(file);
  });

  it('should get a nested directory ', () => {
    const root = new Directory();
    const foo = root.addDirectory('foo');
    const bar = foo.addDirectory('bar');

    const result = root.getEntry('/foo/bar');

    expect(result).to.equal(bar);
  });

  it('should get a nested file ', () => {
    const root = new Directory();
    const foo = root.addDirectory('foo');
    const file = foo.addFile('file.txt', Buffer.from(''));

    const result = root.getEntry('/foo/file.txt');

    expect(result).to.equal(file);
  });

});
