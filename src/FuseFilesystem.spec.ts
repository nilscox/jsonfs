import util from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

import { expect } from 'chai';

import { FuseFilesystem } from './Filesystem';
import { JsonFilesystem } from './JsonFilesystem';

const execPromise = util.promisify(exec);

const { MOUNTPOINT } = {
  MOUNTPOINT: '/tmp/mnt',
  ...process.env,
};

describe.only('FuseFilesystem', () => {

  let fusefs: FuseFilesystem;

  before(async () => {
    fusefs = new FuseFilesystem(MOUNTPOINT, new JsonFilesystem());
    await fusefs.mount();
  });

  after(async () => {
    if (fusefs)
      await fusefs.unmount();
  });

  it('should create a directory', async () => {
    await fs.promises.mkdir(path.join(MOUNTPOINT, 'foo'));
    const entries = await fs.promises.readdir(MOUNTPOINT);

    expect(entries).to.have.length(1);
    expect(entries[0]).to.eql('foo');
  });

  it('should create a file', async () => {
    const file = await fs.promises.open(path.join(MOUNTPOINT, 'file.txt'), 'w');
    await file.close();

    const entries = await fs.promises.readdir(MOUNTPOINT);

    expect(entries).to.have.length(2);
    expect(entries[1]).to.eql('file.txt');
  });

  it('should create a sub-directory', async () => {
    await fs.promises.mkdir(path.join(MOUNTPOINT, 'foo', 'bar'));

    const entries = await fs.promises.readdir(path.join(MOUNTPOINT, 'foo'));

    expect(entries).to.have.length(1);
    expect(entries[0]).to.eql('bar');
  });

  it('should write to a file in a sub-directory', async () => {
    await fs.promises.writeFile(path.join(MOUNTPOINT, 'foo', 'bar', 'file.txt'), 'hello');
    const content = await fs.promises.readFile(path.join(MOUNTPOINT, 'foo', 'bar', 'file.txt'));

    expect(content.toString()).to.eql('hello');
  });

  it('should write to an existing file', async () => {
    await fs.promises.writeFile(path.join(MOUNTPOINT, 'foo', 'bar', 'file.txt'), 'hey');
    const content = await fs.promises.readFile(path.join(MOUNTPOINT, 'foo', 'bar', 'file.txt'));

    expect(content).to.eql('hey');
  });

  it('should list all entries recursively', async () => {
    const result = await execPromise('ls -lR ' + MOUNTPOINT);

    expect(result).to.eql('');
  });

});
