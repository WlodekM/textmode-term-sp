//@flow
/** @module Stat */

import constants from './constants.js';

type Metadata = {
  dev?: number,
  ino: number,
  mode: number,
  nlink: number,
  uid: number,
  gid: number,
  rdev?: number,
  size: number,
  atime: Date,
  mtime: Date,
  ctime: Date,
  birthtime: Date
};

/**
 * Class representing Stat metadata.
 */
class Stat {

  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: void;
  blocks: void;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;

  /**
   * Creates Stat.
   */
  constructor (props: Metadata) {
    this.dev = props.dev || 0;   // in-memory has no devices
    this.ino = props.ino;
    this.mode = props.mode;
    this.nlink = props.nlink;
    this.uid = props.uid;
    this.gid = props.gid;
    this.rdev = props.rdev || 0; // is 0 for regular files and directories
    this.size = props.size;
    this.blksize = undefined;    // in-memory doesn't have blocks
    this.blocks = undefined;     // in-memory doesn't have blocks
    this.atime = props.atime;
    this.mtime = props.mtime;
    this.ctime = props.ctime;
    this.birthtime = props.birthtime;
  }

  /**
   * Checks if file.
   */
  isFile (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFREG;
  }

  /**
   * Checks if directory.
   */
  isDirectory (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFDIR;
  }

  /**
   * Checks if block device.
   */
  isBlockDevice (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFBLK;
  }

  /**
   * Checks if character device.
   */
  isCharacterDevice (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFCHR;
  }

  /**
   * Checks if symbolic link.
   */
  isSymbolicLink (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFLNK;
  }

  /**
   * Checks if FIFO.
   */
  isFIFO (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFIFO;
  }

  /**
   * Checks if socket.
   */
  isSocket (): boolean {
    return (this.mode & constants.S_IFMT) == constants.S_IFSOCK;
  }

}

export default Stat;
