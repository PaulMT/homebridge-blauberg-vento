import {FilterReplacementIndicator, SpeedNumber, UnitOnOff} from './packet';

export class Device {
  constructor(
    public readonly ip: string,
    public readonly deviceId: string,
    public readonly name: string,
    public readonly password: string,
  ) {
  }
}

export class DeviceStatus {
  constructor(
    public readonly active: UnitOnOff,
    public readonly speed: SpeedNumber,
    public readonly filter: FilterStatus,
  ) {
  }
}

export class FilterStatus {
  constructor(
    public readonly life: number,
    public readonly replace: FilterReplacementIndicator,
  ) {
  }
}
