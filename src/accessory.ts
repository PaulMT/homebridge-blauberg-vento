import {CharacteristicValue, Formats, PlatformAccessory, Service} from 'homebridge';

import {BlaubergVentoPlatform} from './platform';
import {VentoExpertClient} from './client';
import {SpeedNumber, UnitOnOff, VentilationMode} from './packet';
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
        unit: 'speed',
        format: Formats.UINT8,
      });

    this.service.getCharacteristic(this.platform.Characteristic.SwingMode)
    .onSet((value) => this.setMode(value ? VentilationMode.HEAT_RECOVERY : VentilationMode.VENTILATION));

    this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .setProps({
        minValue: 0,
        maxValue: 181,
        minStep: 1,
        unit: 'day',
        format: Formats.UINT8,
      });

    this.client = new VentoExpertClient(this.device);

    // setInterval(() => this.client.getStatus()
    //   .then(status => this.service
    //     .updateCharacteristic(this.platform.Characteristic.Active, status.active)
    //     .updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed))
    //   .catch(error => this.platform.log.warn('[%s] Client error:', this.device.deviceId, error.message)), 5_000);
  }

  async getActive(): Promise<CharacteristicValue> {
    this.platform.log.debug('[%s] Get status', this.device.deviceId);
    return this.client.getStatus()
      .then(status => {
        this.platform.log.debug('[%s] Status:', this.device.deviceId, status);
        this.service.updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, status.filter.life);
        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed);
        this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, status.ventilationMode === VentilationMode.HEAT_RECOVERY);
        this.service.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, status.filter.replace);
        return status.active;
      })
      .catch(this.handleError.bind(this));
  }

  async setActive(value: CharacteristicValue) {
    this.platform.log.debug('[%s] Turn on/off ->', this.device.deviceId, value);
    return this.client.turnOnOff(<UnitOnOff>value)
      .then(active => this.platform.log.debug('[%s] Turned on/off:', this.device.deviceId, active))
      .catch(this.handleError.bind(this));
  }

  async setRotationSpeed(value: CharacteristicValue) {
    if (value !== 0) {
      this.platform.log.debug('[%s] Change speed ->', this.device.deviceId, value);
      return this.client.changeSpeed(<SpeedNumber>value)
        .then(speed => this.platform.log.debug('[%s] Speed changed:', this.device.deviceId, speed))
        .catch(this.handleError.bind(this));
    }
  }

  async setMode(value: CharacteristicValue) {
    this.platform.log.debug('[%s] Change mode ->', this.device.deviceId, value);
    return this.client.changeMode(<VentilationMode>value)
      .then(value => this.platform.log.debug('[%s] Mode changed:', this.device.deviceId, value))
      .catch(this.handleError.bind(this));
  }

  private handleError(error: Error): Promise<CharacteristicValue> {
    this.platform.log.warn('[%s] Client error:', this.device.deviceId, error.message);
    throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.OPERATION_TIMED_OUT);
  }
}
