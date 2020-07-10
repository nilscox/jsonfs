declare namespace FuseNative {
  export const ENOENT: number;
  export const EISDIR: number;
  export const EBADF: number;
  export const EEXIST: number;
  export const ENOTDIR: number;
  export const ECANCELED: number;
}

declare module 'fuse-native' {
  export = FuseNative;
}
