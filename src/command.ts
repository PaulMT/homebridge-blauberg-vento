import {createSocket, Socket} from 'dgram';
import {DataBlock, FuncType, Packet, Parameter, SpeedNumber, UnitOnOff} from './packet';

const PORT = 4000;

export class Command {
  private socket: Socket;

  private finished = false;
  private canceled = false;

  private complete?: (value: Packet) => void;
  private fail?: (error: Error) => void;

  private constructor(
    private readonly func: FuncType,
    private readonly data: DataBlock[],
  ) {
    this.socket = createSocket('udp4')
      .on('message', this.socketResponse.bind(this))
      .on('error', this.socketError.bind(this));
  }

  public static status() {
    return new Command(FuncType.READ, [new DataBlock(Parameter.UNIT_ON_OFF), new DataBlock(Parameter.SPEED_NUMBER)]);
  }

  public static onOff(value: UnitOnOff) {
    return new Command(FuncType.WRITE, [new DataBlock(Parameter.UNIT_ON_OFF, value)]);
  }

  public static speed(value: SpeedNumber) {
    return new Command(FuncType.WRITE, [new DataBlock(Parameter.SPEED_NUMBER, value)]);
  }

  public async execute(ip: string, deviceId: string, password: string): Promise<Packet> {
    return new Promise((resolve, reject) => {
      this.complete = resolve;
      this.fail = reject;

      if (!this.canceled) {
        const request = new Packet(deviceId, password, this.func, this.data);
        this.socket.connect(PORT, ip, () => this.socket.send(request.toBytes()));
      }
    });
  }

  public cancel() {
    this.canceled = true;
    if (!this.finished) {
      this.socket.close();
    }
  }

  private socketResponse(message: Buffer) {
    this.finished = true;
    this.socket.close();
    if (this.complete) {
      this.complete(Packet.fromBytes(message));
    }
  }

  private socketError(error) {
    this.finished = true;
    this.socket.close();
    if (this.fail) {
      this.fail(error);
    }
  }
}
