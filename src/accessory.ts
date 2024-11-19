import { CharacteristicValue, Formats, PlatformAccessory, Service } from 'homebridge';

import { BlaubergVentoPlatform } from './platform.js';
import { VentoExpertClient } from './client.js';
import { AlarmWarningIndicator, SpeedNumber, UnitOnOff, VentilationMode } from './packet.js';
import { Device, DeviceStatus } from './device.js';

export class VentoExpertAccessory {
  private service: Service;
  private client: VentoExpertClient;
  private deviceStatus!: DeviceStatus;

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
      .onSet(this.setSwingMode.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .setProps({
        minValue: 0,
        maxValue: 181,
        minStep: 1,
        unit: 'day',
        format: Formats.UINT8,
      });

    this.client = new VentoExpertClient(this.device);

    if (this.device.resetAlarm) {
      setInterval(() => this.getActive()
        .then(() => {
          if (this.deviceStatus.alarm !== AlarmWarningIndicator.NO) {
            this.platform.log.warn('Device Alarm: ' + this.deviceStatus.alarm + '. Turn Off/On triggered.');
            this.setActive(UnitOnOff.OFF)
              .then(() => this.setActive(UnitOnOff.ON));
          }
        }), 300_000);
    }
  }

  async getActive(): Promise<CharacteristicValue> {
    this.platform.log.debug('[%s] Get status', this.device.deviceId);
    return this.client.getStatus()
      .then(status => {
        this.deviceStatus = status;
        this.platform.log.debug('[%s] Status:', this.device.deviceId, status);
        if (status.alarm === AlarmWarningIndicator.NO) {
          this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed);
        } else {
          this.platform.log.warn('Device Alarm: ' + this.deviceStatus.alarm);
          this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, new Error('Device Alarm: ' + status.alarm));
        }
        this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, status.mode);
        this.service.updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, status.filter.life);
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

  async setSwingMode(value: CharacteristicValue) {
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
