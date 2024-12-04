import { CharacteristicGetCallback, CharacteristicValue, Formats, HAPStatus, PlatformAccessory, Service } from 'homebridge';

import { BlaubergVentoPlatform } from './platform.js';
import { VentoExpertClient } from './client.js';
import { AlarmWarningIndicator, SpeedNumber, UnitOnOff, VentilationMode } from './packet.js';
import { Device, DeviceStatus } from './device.js';
import { PLUGIN_VERSION } from './settings.js';

export class VentoExpertAccessory {
  private service: Service;
  private filterService: Service;
  private humidityService!: Service;
  private client: VentoExpertClient;

  constructor(
    private readonly platform: BlaubergVentoPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
  ) {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Blauberg Ventilatoren GmbH')
      .setCharacteristic(this.platform.Characteristic.Model, 'Vento Expert')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, PLUGIN_VERSION);

    this.service = this.accessory.getService(this.platform.Service.Fanv2) || this.accessory.addService(this.platform.Service.Fanv2);
    this.filterService = this.accessory.getService(this.platform.Service.FilterMaintenance)
      || this.accessory.addService(this.platform.Service.FilterMaintenance);

    if (device.humidity) {
      this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor)
        || this.accessory.addService(this.platform.Service.HumiditySensor);

      this.humidityService.setCharacteristic(this.platform.Characteristic.Name, device.humidityName);
    }

    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name);

    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .on('get', this.getActive.bind(this))
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

    this.filterService.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .setProps({
        minValue: 0,
        maxValue: 181,
        minStep: 1,
        unit: 'day',
        format: Formats.UINT8,
      });

    this.client = new VentoExpertClient(this.device);

    if (this.device.resetAlarm) {
      setInterval(() => this.client.getStatus()
        .then(status => {
          if (status.alarm !== AlarmWarningIndicator.NO) {
            this.platform.log.warn('[%s] Device Alarm: %s. Turn Off/On triggered.', this.device.name, status.alarm);
            this.setActive(UnitOnOff.OFF)
              .then(() => this.setActive(UnitOnOff.ON));
          }
        }), 300_000);
    }
  }

  async getActive(callback: CharacteristicGetCallback) {
    this.platform.log.debug('[%s] Get status', this.device.name);
    return this.client.getStatus()
      .then(status => {
        this.platform.log.debug('[%s] Status:', this.device.name, status);
        this.updateCharacteristics(status);

        if (status.alarm === AlarmWarningIndicator.NO) {
          callback(null, status.active);
        } else {
          this.platform.log.warn('[%s] Device Alarm:', this.device.name, status.alarm);
          callback(HAPStatus.OUT_OF_RESOURCE, status.active);
        }
      })
      .catch(this.handleError.bind(this));
  }

  async setActive(value: CharacteristicValue) {
    this.platform.log.debug('[%s] Turn on/off ->', this.device.name, value);
    return this.client.turnOnOff(<UnitOnOff>value)
      .then(active => this.platform.log.debug('[%s] Turned on/off:', this.device.name, active))
      .catch(this.handleError.bind(this));
  }

  async setRotationSpeed(value: CharacteristicValue) {
    if (value !== 0) {
      this.platform.log.debug('[%s] Change speed ->', this.device.name, value);
      return this.client.changeSpeed(<SpeedNumber>value)
        .then(speed => this.platform.log.debug('[%s] Speed changed:', this.device.name, speed))
        .catch(this.handleError.bind(this));
    }
  }

  async setSwingMode(value: CharacteristicValue) {
    this.platform.log.debug('[%s] Change mode ->', this.device.name, value);
    return this.client.changeMode(<VentilationMode>value)
      .then(value => this.platform.log.debug('[%s] Mode changed:', this.device.name, value))
      .catch(this.handleError.bind(this));
  }

  private async updateCharacteristics(status: DeviceStatus) {
    this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed);
    this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, status.mode);
    this.filterService.updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, status.filter.life);
    this.filterService.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, status.filter.replace);

    if (this.device.humidity) {
      this.humidityService.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, status.humidity);
    }
  }

  private handleError(error: Error): Promise<CharacteristicValue> {
    this.platform.log.warn('[%s] Client error:', this.device.name, error.message);
    throw new this.platform.api.hap.HapStatusError(HAPStatus.OPERATION_TIMED_OUT);
  }
}
