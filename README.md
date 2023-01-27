<p align="center"><img src="https://blaubergventilatoren.de/assets/9f5a0cb2/images/blauberg.svg" width="200"></p>

# Homebridge Blauberg Vento

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
          "password": "1111"
        }
      ]
    }
    ```
   Config properties:
   - Device Name (name): Accessory name in iOS Home app.
   - IP Address (ip): Your device static IP address.
   - Device ID (deviceId): Your device ID (you can find it in Blauberg Vento V.2 mobile app).
   - Password (password): Your device password (default 1111, can be changed in mobile app).

## Features:

- Turning Fan on and off
- Getting and setting Fan speed

## Supported Models:

I've only two units of one model (VENTO Expert A100-1 W V.2), so I can't check if it will work fine with other models.
According to Blauberg _Connection to a „Smart Home“ system - connection guide_ - they all have same API, so this plugin should work fine for all listed bellow.

- VENTO Expert A30 W V.2
- VENTO Expert A50-1 W V.2
- VENTO Expert A85-1 W V.2
- <span style="color:green">VENTO Expert A100-1 W V.2</span>
- VENTO Expert Duo A30-1 W V.2
- VENTO Expert A50-1 W V.3

## Release notes:

### 0.5.3
- First plugin release which allows you to add multiple devices and control them (on/off, change speed).

### 0.7.0
- Added API bottleneck to prevent simultaneous requests.
- Added API command timeout.
- Updated logging, added error handling.
- Updated config schema.