<p align="center"><img src="https://blaubergventilatoren.de/assets/9f5a0cb2/images/blauberg.svg" width="200"></p>

# Homebridge Blauberg Vento

[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59&style=for-the-badge&logoColor=%23FFFFFF&logo=homebridge)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

This is a Homebridge plugin which allows you to control your Blauberg Vento Expert devices from HomeKit.


## Installation

1. This is Homebridge plugin, so make sure you have Homebridge Server up & running ([Homebridge site](https://homebridge.io)).
2. Assign static IP address to your device (see your router settings).
3. Install **homebridge-blauberg-vento** plugin using Homebridge UI or use this command: `sudo npm install -g homebridge-blauberg-vento`.
4. Configure plugin using Homebridge UI or `~/.homebridge/config.json`.
    ```json
    {
      "platform": "BlaubergVento",
      "devices": [
        {
          "name": "Bedroom Fan",
          "ip": "192.168.1.1",
          "deviceId": "0123456789ABCDEF",
          "password": "1111",
          "resetAlarm": false,
          "swingModeOn": 1,
          "swingModeOff": 0,
          "humidity": false
        }
      ]
    }
    ```
   Config properties:
   - Device Name (name): Accessory name in Home app.
   - IP Address (ip): Your device static IP address.
   - Device ID (deviceId): Your device ID (you can find it in Blauberg Vento V.2 mobile app).
   - Password (password): Your device password (default 1111, can be changed in mobile app).
   - Reset alarms (resetAlarm): Automatically reset alarms for this device (checked every 5 minutes).
   - Swing Mode On (swingModeOn): Device ventilation mode when swing mode is On in Home app.
   - Swing Mode Off (swingModeOff): Device ventilation mode when swing mode is Off in Home app.
   - Show Humidity Sensor (humidity): Show Humidity Sensor data in Home app.

## Features:

- Turning Fan on and off
- Getting and setting Fan speed
- Show current relative humidity
- Show filter status
- Getting and setting ventilation operation mode using swing control
- Show Fan as "Not Responding" when device alarm received
- [Optional] Reset alarms automatically (when enabled, plugin will check device alarms every 5 minutes and will turn off and turn on device when alarm occured)

## Supported Models:

I've only two units of one model (VENTO Expert A100-1 W V.2), so I can't check if it will work fine with other models.
According to Blauberg [Connection to a "Smart Home" system guide](https://blaubergventilatoren.net/download/vento-expert-a100-1-s10-w-v2-manual-14758.pdf) - they all have same API, so this plugin should work fine for all listed bellow.

- VENTO Expert A30 W V.2
- VENTO Expert A50-1 W V.2
- VENTO Expert A85-1 W V.2
- <span style="color:green">VENTO Expert A100-1 W V.2</span>
- VENTO Expert Duo A30-1 W V.2
- VENTO Expert A50-1 W V.3

## Release notes:

### 1.0.0
- Added Humidity Sensor
- Select ventilation mode options
- Prepare for Homebridge 2.0
- Updated npm packages
- Minor fixes and improvements

### 0.9.0
- Added ventilation operation mode
- Added device alarm/warning indicator
- Added automatic alarms reset

### 0.8.0
- Added filter status

### 0.7.2
- Fixed issue with continuous timeouts.
- Show speed as number in Home app instead of percentages.

### 0.7.1
- Updated npm packages.

### 0.7.0
- Added API bottleneck to prevent simultaneous requests.
- Added API command timeout.
- Updated logging, added error handling.
- Updated config schema.

### 0.5.3
- First plugin release which allows you to add multiple devices and control them (on/off, change speed).