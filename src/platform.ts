import { API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { VentoExpertAccessory } from './accessory.js';
import { Device } from './device.js';

export class BlaubergVentoPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.api.on('didFinishLaunching', () => this.discoverDevices());
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  discoverDevices() {
    if (this.config.devices) {
      this.config.devices.forEach(this.configureDevice.bind(this));
    }
  }

  configureDevice(device: Device) {
    const uuid = this.api.hap.uuid.generate(device.deviceId);
    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      new VentoExpertAccessory(this, existingAccessory, device);
    } else {
      this.log.info('Adding new accessory:', device.name);
      const accessory = new this.api.platformAccessory(device.name, uuid);
      new VentoExpertAccessory(this, accessory, device);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
