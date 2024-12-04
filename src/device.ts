import { AlarmWarningIndicator, FilterReplacementIndicator, SpeedNumber, UnitOnOff, VentilationMode } from './packet.js';

export class Device {
  constructor(
    public readonly ip: string,
    public readonly deviceId: string,
    public readonly name: string,
    public readonly password: string,
    public readonly resetAlarm: boolean,
    public readonly humidity: boolean,
    public readonly humidityName: string,
  ) {
  }
}

export class DeviceStatus {
  constructor(
    public readonly active: UnitOnOff,
    public readonly speed: SpeedNumber,
    public readonly humidity: number,
    public readonly mode: VentilationMode,
    public readonly alarm: AlarmWarningIndicator,
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
