import {TextDecoder, TextEncoder} from 'util';

const MAX_PACKET_SIZE = 256;
const PACKET_START = 0xFD;
const PROTOCOL_TYPE = 0x02;

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

export class Packet {

  constructor(public readonly deviceId: string,
              public readonly password: string,
              public readonly func: FuncType,
              public readonly data: DataBlock[]) {
  }

  public toBytes(): Uint8Array {
    const bytes = new Uint8Array(MAX_PACKET_SIZE);
    let i = 0;

    // Header
    bytes[i++] = PACKET_START;
    bytes[i++] = PACKET_START;
    bytes[i++] = PROTOCOL_TYPE;

    // Device ID
    bytes[i++] = this.deviceId.length;
    bytes.set(TEXT_ENCODER.encode(this.deviceId), i);
    i += this.deviceId.length;

    // Password
    bytes[i++] = this.password.length;
    bytes.set(TEXT_ENCODER.encode(this.password), i);
    i += this.password.length;

    // Function
    bytes[i++] = this.func;

    // Data
    this.data.forEach(dataBlock => {
      bytes[i++] = dataBlock.parameter;
      if (this.func === FuncType.WRITE) {
        bytes[i++] = dataBlock.value!;
      }
    });

    // Checksum
    bytes.set(Packet.checksum(bytes.subarray(2, i)), i);
    return bytes.subarray(0, i + 2);
  }

  public static fromBytes(bytes: Uint8Array): Packet {
    let i = 0;

    // Header
    if (bytes[i++] !== PACKET_START || bytes[i++] !== PACKET_START || bytes[i++] !== PROTOCOL_TYPE) {
      throw new Error('Invalid packet header: ' + bytes.subarray(0, 3));
    }

    // Device ID
    const deviceIdSize = bytes[i++];
    const deviceId = TEXT_DECODER.decode(bytes.subarray(i, i + deviceIdSize));
    i += deviceIdSize;

    // Password
    const passwordSize = bytes[i++];
    const password = TEXT_DECODER.decode(bytes.subarray(i, i + passwordSize));
    i += passwordSize;

    // Function
    if (bytes[i++] !== FuncType.RESPONSE) {
      throw new Error('Invalid packet function: ' + bytes[i - 1]);
    }

    // Data
    const dataBlocks: DataBlock[] = [];
    while (i < bytes.length - 2) {
      if (bytes[i] === 0xFE) {
        i++;// skip special command
        const paramSize = bytes[i++];
        const param = bytes[i++];
        const data = bytes.subarray(i, i += paramSize);

        dataBlocks.push(new DataBlock(param, undefined, data));
      } else {
        dataBlocks.push(new DataBlock(bytes[i++], bytes[i++]));
      }
    }

    // Checksum
    const calculated = Packet.checksum(bytes.subarray(2, i));
    const actual = [bytes[i++], bytes[i++]];
    if (calculated[0] !== actual[0] || calculated[1] !== actual[1]) {
      throw new Error('Invalid packet checksum. Expected: ' + calculated + '. Actual: ' + actual);
    }

    return new Packet(deviceId, password, FuncType.RESPONSE, dataBlocks);
  }

  private static checksum(bytes: Uint8Array): number[] {
    let checksum = 0;
    bytes.forEach(b => checksum += b);
    checksum = checksum & 0xFFFF;
    return [checksum & 0xFF, checksum >> 8];
  }
}

export enum FuncType {
  READ = 0x01,
  WRITE = 0x03,
  RESPONSE = 0x06
}

export enum Parameter {
  UNIT_ON_OFF = 0x01,
  SPEED_NUMBER = 0x02,
  FILTER_TIMER_COUNTDOWN = 0x64,
  FILTER_REPLACEMENT_INDICATOR = 0x88,
  VENTILATION_OPERATION_MODE = 0xB7,
}

export enum UnitOnOff {
  ON = 1,
  OFF = 0
}

export enum SpeedNumber {
  SPEED_1 = 1,
  SPEED_2 = 2,
  SPEED_3 = 3
}

export enum VentilationMode {
  VENTILATION = 0,
  HEAT_RECOVERY = 1,
  SUPPLY = 2
}


export enum FilterReplacementIndicator {
  REQUIRED = 1,
  NOT_REQUIRED = 0
}

export class DataBlock {
  constructor(public readonly parameter: Parameter,
              public readonly value?: number,
              public readonly data?: Uint8Array) {
  }
}
