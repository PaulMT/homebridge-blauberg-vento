import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {BlaubergVentoPlatform} from './platform';
import {VentoExpertClient} from "./client";
import {SpeedNumber, UnitOnOff} from "./packet";

const SPEED_1 = 33;
const SPEED_2 = 67;
const SPEED_3 = 100;

export class VentoExpertAccessory {
    private service: Service;
    private client: VentoExpertClient;

    constructor(
        private readonly platform: BlaubergVentoPlatform,
        private readonly accessory: PlatformAccessory,
        private readonly device
    ) {
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Blauberg')
            .setCharacteristic(this.platform.Characteristic.Model, 'Vento Expert')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);

        this.service = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);

        this.service.setCharacteristic(this.platform.Characteristic.Name, device.name);

        this.service.getCharacteristic(this.platform.Characteristic.Active)
            .onGet(this.getActive.bind(this))
            .onSet(this.setActive.bind(this));

        this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed)
            .onSet(this.setRotationSpeed.bind(this));

        this.client = new VentoExpertClient(platform, this.device);
    }

    async getActive(): Promise<CharacteristicValue> {
        return this.client.getStatus()
            .then(status => {
                this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, VentoExpertAccessory.speedFromNumber(status.speed));
                return status.active;
            });
    }

    async setActive(value: CharacteristicValue) {
        await this.client.turnOnOff(<UnitOnOff>value);
    }

    async setRotationSpeed(value: CharacteristicValue) {
        await this.client.changeSpeed(VentoExpertAccessory.speedToNumber(value));
    }

    private static speedFromNumber(value: SpeedNumber): CharacteristicValue {
        return value === SpeedNumber.SPEED_1 ? SPEED_1 : value === SpeedNumber.SPEED_2 ? SPEED_2 : SPEED_3;
    }

    private static speedToNumber(value: CharacteristicValue): SpeedNumber {
        return value <= SPEED_1 ? SpeedNumber.SPEED_1 : value <= SPEED_2 ? SpeedNumber.SPEED_2 : SpeedNumber.SPEED_3;
    }
}
