import { expect } from 'chai';

import { Directory } from './Directory';
import { File } from './File';

describe('File', () => {

  it('should not create a file when its name contains a slash', () => {
    expect(() => new File(new Directory(), 'fi/le.txt', Buffer.alloc(0))).to.throw('File name cannot include a /');
  });

  it('should create a file', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));

    expect(file.name).eql('file.txt');
    expect(file.size).eql(5);
    expect(file.content.toString()).eql('hello');
    expect(file.path).eql('/file.txt');
  });

  it('should read from a file', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));
    const buf = Buffer.alloc(16);

    const result = file.read(buf, 2, 1);

    expect(result).to.eql(2);
    expect(buf[0]).to.eql(0x65);
    expect(buf[1]).to.eql(0x6c);
    expect(buf[2]).to.eql(0x0);
  });

  it('should read a whole file', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));
    const buf = Buffer.alloc(16);

    const result = file.read(buf, 5, 0);

    expect(result).to.eql(5);
    expect(buf.toString()).to.match(/^hello/);
  });

  it('should write to a file', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));
    const buf = Buffer.from('aw');

    const result = file.write(buf, 2, 1);

    expect(result).to.eql(2);
    expect(file.content.toString()).to.eql('hawlo');
  });

  it('should write to a file and reallocate its buffer', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hey'));
    const buf = Buffer.from('hello');

    const result = file.write(buf, 5, 0);

    expect(result).to.eql(5);
    expect(file.content.toString()).to.eql('hello');
  });

  it('should truncate the file to a smaller size', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));

    file.truncate(3);

    expect(file.content.toString()).to.eql('hel');
  });

  it('should truncate the file to a larger size', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));

    file.truncate(8);

    expect(file.content.toString()).to.eql('hello\u0000\u0000\u0000');
  });

  it('should truncate the file to the same size', () => {
    const file = new File(new Directory(), 'file.txt', Buffer.from('hello'));

    file.truncate(5);

    expect(file.content.toString()).to.eql('hello');
  });

});
