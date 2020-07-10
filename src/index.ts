/// <reference path="./fuse-native.d.ts" />

import { JsonFilesystem } from './JsonFilesystem';

const main = async () => {
  const mnt = process.argv[2];
  console.log(mnt);
  const fs = new JsonFilesystem(mnt, { debug: true });

  await fs.mount();
  process.on('SIGINT', () => fs.unmount());
};

main().catch(console.error);
