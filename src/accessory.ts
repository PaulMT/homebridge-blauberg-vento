import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {BlaubergVentoPlatform} from './platform';
import {VentoExpertClient} from './client';
import {SpeedNumber, UnitOnOff} from './packet';
import {Device} from './device';

// Minimum time difference (in ms) between setActive() and setRotationSpeed() events.
const MIN_ACTIVE_SPEED_DIFF = 100;

export class VentoExpertAccessory {
  private service: Service;
  private client: VentoExpertClient;

  private lastSpeedChangeTime = 0;

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
  }

  async getActive(): Promise<CharacteristicValue> {
    return this.client.getStatus()
      .then(status => {
        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, status.speed);
        return status.active;
      });
  }

  async setActive(value: CharacteristicValue) {
    this.isSpeedChange(value)
      .then(isSpeedChange => {
        if (!isSpeedChange) {
          this.client.turnOnOff(<UnitOnOff>value);
        } else {
          this.platform.log.debug('Ignore set active (speed change)');
        }
      });
  }

  async setRotationSpeed(value: CharacteristicValue) {
    if (value !== 0) {
      this.lastSpeedChangeTime = Date.now();
      await this.client.changeSpeed(<SpeedNumber>value);
    }
  }

  /**
   * This function is needed to prevent two simultaneous requests to API (turn on and change speed).
   *
   * When user changes speed in homekit we receive 2 events: setActive(1) and setRotationSpeed(x).
   * If we send these 2 requests to API it behaves unstable. So to prevent this we ignore setActive(1) event.
   *
   * @param value set active characteristic value
   * @return true if this setActive event triggered by a speed change; false otherwise
   * @private
   */
  private async isSpeedChange(value: CharacteristicValue): Promise<boolean> {
    if (value === this.platform.Characteristic.Active.ACTIVE) {
      return new Promise<boolean>(resolve => {
        // sleep
        setTimeout(() => {
          // check time diff between last speed change
          const timeDiff = Date.now() - this.lastSpeedChangeTime;
          resolve(timeDiff <= MIN_ACTIVE_SPEED_DIFF);
        }, MIN_ACTIVE_SPEED_DIFF / 2);
      });
    } else {
      return false;
    }
  }
}
