import { Command } from './command.js';
import { Packet, SpeedNumber, UnitOnOff, VentilationMode } from './packet.js';
import { Device, DeviceStatus, FilterStatus } from './device.js';
import Bottleneck from 'bottleneck';

const COMMAND_TIMEOUT = 2000;

export class VentoExpertClient {
  private limiter = new Bottleneck({ maxConcurrent: 1 });

  constructor(private readonly device: Device) {
  }

  public async getStatus(): Promise<DeviceStatus> {
    return this.send(Command.status())
      .then(response => new DeviceStatus(
        response.data[0].value!, // UNIT_ON_OFF
        response.data[1].value!, // SPEED_NUMBER
        response.data[2].value!, // CURRENT_HUMIDITY
        response.data[3].value!, // VENTILATION_MODE
        response.data[4].value!, // ALARM_WARNING_INDICATOR
        new FilterStatus(
          response.data[5].data![2], // FILTER_TIMER_COUNTDOWN
          response.data[6].value!, // FILTER_REPLACEMENT_INDICATOR
        ),
      ));
  }

  public async turnOnOff(value: UnitOnOff): Promise<UnitOnOff> {
    return this.send(Command.onOff(value))
      .then(response => response.data[0].value!);
  }

  public async changeSpeed(value: SpeedNumber): Promise<SpeedNumber> {
    return this.send(Command.speed(value))
      .then(response => response.data[0].value!);
  }

  public async changeMode(value: VentilationMode): Promise<VentilationMode> {
    return this.send(Command.mode(value))
      .then(response => response.data[0].value!);
  }

  private async send(command: Command): Promise<Packet> {
    return Promise.race([
      new Promise<Packet>((resolve, reject) => setTimeout(() => {
        command.cancel();
        reject(new Error('Command timeout'));
      }, COMMAND_TIMEOUT)),
      this.limiter.schedule(() => command.execute(this.device.ip, this.device.deviceId, this.device.password)),
    ]);
  }
}
