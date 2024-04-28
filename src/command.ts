import {createSocket, Socket} from 'dgram';
import {DataBlock, FuncType, Packet, Parameter, SpeedNumber, UnitOnOff, VentilationMode} from './packet';

const PORT = 4000;

export class Command {
  private socket: Socket;

  private complete?: (value: Packet) => void;
  private fail?: (error: Error) => void;

  private constructor(
    private readonly func: FuncType,
    private readonly data: DataBlock[],
  ) {
    this.socket = createSocket('udp4')
      .on('message', this.response.bind(this))
      .on('error', this.cancel.bind(this));
  }

  public static status() {
    return new Command(FuncType.READ, [
      new DataBlock(Parameter.UNIT_ON_OFF),
      new DataBlock(Parameter.SPEED_NUMBER),
      new DataBlock(Parameter.VENTILATION_OPERATION_MODE),
      new DataBlock(Parameter.FILTER_TIMER_COUNTDOWN),
      new DataBlock(Parameter.FILTER_REPLACEMENT_INDICATOR),
    ]);
  }

  public static onOff(value: UnitOnOff) {
    return new Command(FuncType.WRITE, [new DataBlock(Parameter.UNIT_ON_OFF, value)]);
  }

  public static speed(value: SpeedNumber) {
    return new Command(FuncType.WRITE, [new DataBlock(Parameter.SPEED_NUMBER, value)]);
  }

  public static mode(value: VentilationMode) {
    return new Command(FuncType.WRITE, [new DataBlock(Parameter.VENTILATION_OPERATION_MODE, value)]);
  }

  public async execute(ip: string, deviceId: string, password: string): Promise<Packet> {
    return new Promise((resolve, reject) => {
      this.complete = resolve;
      this.fail = reject;

      try {
        const request = new Packet(deviceId, password, this.func, this.data);
        this.socket.connect(PORT, ip, () => this.socket.send(request.toBytes()));
      } catch (e) {
        this.cancel();
      }
    });
  }

  public cancel(reason?: Error) {
    this.close();
    this.fail?.(reason || new Error());
  }

  private response(message: Buffer) {
    this.close();
    this.complete?.(Packet.fromBytes(message));
  }

  private close() {
    try {
      this.socket.close();
    } catch (e) {// ignore
    }
  }
}
