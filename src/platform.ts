import {API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {VentoExpertAccessory} from './accessory';

export class BlaubergVentoPlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.api.on('didFinishLaunching', () => this.discoverDevices());
    }

    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }

    discoverDevices() {
        for (const device of this.config.devices) {
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
}
