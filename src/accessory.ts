import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {BlaubergVentoPlatform} from './platform';
import {VentoExpertClient} from './client';
import {SpeedNumber, UnitOnOff} from './packet';
import {Device} from './device';

export class VentoExpertAccessory {
  private service: Service;
  private client: VentoExpertClient;

  constructor(
    private readonly platform: BlaubergVentoPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
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
      .onSet(this.setRotationSpeed.bind(this))
      .setProps({
        minValue: 0,
        maxValue: 3,
        minStep: 1,
      });

    this.client = new VentoExpertClient(platform, this.device);

    setInterval(() => this.client.getStatus()
      .then(status => this.service
        .updateCharacteristic(this.platform.Characteristic.Active, status.active)
        .updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed)), 5_000);
  }

  async getActive(): Promise<CharacteristicValue> {
    return this.client.getStatus()
      .then(status => {
        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed);
        return status.active;
      });
  }

  async setActive(value: CharacteristicValue) {
    return this.client.turnOnOff(<UnitOnOff>value);
  }

  async setRotationSpeed(value: CharacteristicValue) {
    if (value !== 0) {
      return this.client.changeSpeed(<SpeedNumber>value);
    }
  }
}
