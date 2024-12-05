import { AlarmWarningIndicator, FilterReplacementIndicator, SpeedNumber, UnitOnOff, VentilationMode } from './packet.js';

export class Device {
  public readonly ip!: string;
  public readonly deviceId!: string;
  public readonly name!: string;
  public readonly password!: string;
  public readonly resetAlarm: boolean = false;
  public readonly swingModeOn: VentilationMode = VentilationMode.HEAT_RECOVERY;
  public readonly swingModeOff: VentilationMode = VentilationMode.VENTILATION;
  public readonly humidity: boolean = false;

  constructor(config?: Partial<Device>) {
    Object.assign(this, config);
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
