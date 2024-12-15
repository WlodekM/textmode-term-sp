//@flow
/** @module Devices */

import type { CharacterDev } from './INodes.js';
import type { FileDescriptor } from './FileDescriptors.js';

import Counter from 'resource-counter';

const MAJOR_BITSIZE = 12;
const MINOR_BITSIZE = 20;
const MAJOR_MAX = (2 ** MAJOR_BITSIZE) - 1;
const MINOR_MAX = (2 ** MINOR_BITSIZE) - 1;
const MAJOR_MIN = 0;
const MINOR_MIN = 0;

class DeviceError extends Error {

  static ERROR_RANGE: number;
  static ERROR_CONFLICT: number;
  code: number;

  constructor (code: number, message: string | undefined | null) {
    //@ts-ignore
    super(message);
    this.code = code;
  }

}

Object.defineProperty(
  DeviceError,
  'ERROR_RANGE',
  {value: 1}
);

Object.defineProperty(
  DeviceError,
  'ERROR_CONFLICT',
  {value: 2}
);

type INodeDevices = CharacterDev;

interface DeviceInterface<I> {
  open?: (_: FileDescriptor<I>) => void;
  close?: (_: FileDescriptor<I>) => void;
  setPos?: (_: FileDescriptor<I>, __: number, ___: number) => void;
  read?: (_: FileDescriptor<I>, __: Buffer, ___: number) => number;
  write?: (_: FileDescriptor<I>, __: Buffer, ___: number, ____: number) => number;
}

class DeviceManager {

  _chrCounterMaj: Counter;
  _chrDevices: Map<number, [Map<number, DeviceInterface<CharacterDev>>, Counter]>;

  constructor () {
    this._chrCounterMaj = new Counter(MAJOR_MIN);
    this._chrDevices = new Map;
  }

  getChr (major: number, minor: number): DeviceInterface<CharacterDev> | undefined {
    const devicesAndCounterMin = this._chrDevices.get(major);
    if (devicesAndCounterMin) {
      const [devicesMin] = devicesAndCounterMin;
      return devicesMin.get(minor);
    }
    return;
  }

  registerChr (
    device: DeviceInterface<CharacterDev>,
    major: number|void,
    minor: number|void
  ): void {
    let autoAllocMaj: number | undefined;
    let autoAllocMin: number | undefined;
    let counterMin: Counter;
    let devicesMin: Map<number, DeviceInterface<CharacterDev>>;
    try {
      if (major === undefined) {
        major = this._chrCounterMaj.allocate();
        //@ts-ignore
        autoAllocMaj = major;
      } else {
        const devicesCounterMin = this._chrDevices.get(major);
        if (!devicesCounterMin) {
          this._chrCounterMaj.allocate(major);
          autoAllocMaj = major;
        } else {
          [devicesMin, counterMin] = devicesCounterMin;
        }
      }
      //@ts-ignore
      if (!devicesMin || !counterMin) {
        counterMin = new Counter(MINOR_MIN);
        devicesMin = new Map;
      }
      if (minor === undefined) {
        minor = counterMin.allocate();
        //@ts-ignore
        autoAllocMin = minor;
      } else {
        if (!devicesMin.has(minor)) {
          counterMin.allocate(minor);
          autoAllocMin = minor;
        } else {
          throw new DeviceError(DeviceError.ERROR_CONFLICT, null);
        }
      }
      if ((major as number) > MAJOR_MAX ||
          (major as number) < MAJOR_MIN ||
          (minor as number) > MINOR_MAX ||
          (minor as number) < MINOR_MIN)
      {
        throw new DeviceError(DeviceError.ERROR_RANGE, null);
      }
      devicesMin.set(minor as number, device);
      this._chrDevices.set(major as number, [devicesMin, counterMin]);
      return;
    } catch (e) {
      if (autoAllocMaj != null) {
        this._chrCounterMaj.deallocate(autoAllocMaj);
      }
      //@ts-ignore
      if (autoAllocMin != null && counterMin) {
        counterMin.deallocate(autoAllocMin);
      }
      throw e;
    }
  }

  deregisterChr (major: number, minor: number): void {
    const devicesCounterMin = this._chrDevices.get(major);
    if (devicesCounterMin) {
      const [devicesMin, counterMin] = devicesCounterMin;
      if (devicesMin.delete(minor)) {
        counterMin.deallocate(minor);
      }
      if (!devicesMin.size) {
        this._chrDevices.delete(major);
        this._chrCounterMaj.deallocate(major);
      }
    }
    return;
  }

}

function mkDev (major: number, minor: number): number {
  return ((major << MINOR_BITSIZE) | minor);
}

function unmkDev (dev: number): [number, number] {
  const major = dev >> MINOR_BITSIZE;
  const minor = dev & ((1 << MINOR_BITSIZE) - 1);
  return [major, minor];
}

export {
  MAJOR_BITSIZE,
  MINOR_BITSIZE,
  MAJOR_MAX,
  MINOR_MAX,
  MAJOR_MIN,
  MINOR_MIN,
  DeviceManager,
  DeviceError,
  mkDev,
  unmkDev
};

export type { INodeDevices, DeviceInterface };
