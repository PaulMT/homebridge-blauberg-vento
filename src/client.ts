import {BlaubergVentoPlatform} from './platform';
import {createSocket} from 'dgram';
import {Packet, SpeedNumber, UnitOnOff} from './packet';
import {Device} from './device';
import Bottleneck from 'bottleneck';

const PORT = 4000;

export class VentoExpertClient {
  private limiter = new Bottleneck({maxConcurrent: 1});

  constructor(private readonly platform: BlaubergVentoPlatform,
              private readonly device: Device) {
  }

  async getStatus(): Promise<{ active: UnitOnOff; speed: SpeedNumber }> {
    this.platform.log.debug('[%s] Get status', this.device.deviceId);
    return this.send(Packet.status(this.device.deviceId, this.device.password))
      .then(response => {
        const status = {
          active: response.data[0].value!,
          speed: response.data[1].value!,
        };
        this.platform.log.debug('[%s] Status:', this.device.deviceId, status);
        return status;
      });
  }

  async turnOnOff(value: UnitOnOff) {
    this.platform.log.debug('[%s] Turn on/off ->', this.device.deviceId, value);
    await this.send(Packet.onOff(this.device.deviceId, this.device.password, value))
      .then(response => this.platform.log.debug('[%s] Turned on/off', this.device.deviceId, response.data[0].value!));
  }

  async changeSpeed(value: SpeedNumber) {
    this.platform.log.debug('[%s] Change speed ->', this.device.deviceId, value);
    await this.send(Packet.speed(this.device.deviceId, this.device.password, value))
      .then(response => this.platform.log.debug('[%s] Speed', this.device.deviceId, response.data[1].value!));
  }

  private async send(request: Packet): Promise<Packet> {
    return this.limiter.schedule(() => new Promise<Packet>(resolve => {
      const socket = createSocket('udp4');

      socket.on('message', (message) => {
        const response = Packet.fromBytes(message);
        this.platform.log.debug('[%s] Response:', this.device.deviceId, response);
        socket.close();
        resolve(response);
      });

      socket.connect(PORT, this.device.ip, () => {
        this.platform.log.debug('[%s] Request:', this.device.deviceId, request);
        socket.send(request.toBytes());
      });
    }));
  }
}
