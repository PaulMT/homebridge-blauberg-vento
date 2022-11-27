import {BlaubergVentoPlatform} from "./platform";
import {createSocket} from "dgram";
import {Packet, SpeedNumber, UnitOnOff} from "./packet";

const PORT = 4000;

export class VentoExpertClient {

    constructor(private readonly platform: BlaubergVentoPlatform,
                private readonly device) {
    }

    async getStatus(): Promise<{ active: UnitOnOff, speed: SpeedNumber }> {
        this.platform.log.info('Get status');
        return this.send(Packet.status(this.device.deviceId, this.device.password))
            .then(response => {
                let status = {
                    active: response.data[0].value!,
                    speed: response.data[1].value!
                };
                this.platform.log.info('Status:', status);
                return status;
            });
    }

    async turnOnOff(value: UnitOnOff) {
        this.platform.log.info('Turn on/off ->', value.toString());
        await this.send(Packet.onOff(this.device.deviceId, this.device.password, value))
            .then(response => this.platform.log.info('Turned', response.data[0].value! === UnitOnOff.ON ? 'on' : 'off'));
    }

    async changeSpeed(value: SpeedNumber) {
        this.platform.log.info('Change speed ->', value);
        await this.send(Packet.speed(this.device.deviceId, this.device.password, value))
            .then(response => this.platform.log.info('Speed:', response.data[0].value!));
    }

    private async send(request: Packet): Promise<Packet> {
        return new Promise<Packet>(resolve => {
            const socket = createSocket('udp4');

            socket.on('message', (message) => {
                const response = Packet.fromBytes(message);
                this.platform.log.debug('Response:', response);
                resolve(response);
            });

            socket.connect(PORT, this.device.ip, () => {
                this.platform.log.debug('Request:', request);
                socket.send(request.toBytes())
            });
        });
    }
}
