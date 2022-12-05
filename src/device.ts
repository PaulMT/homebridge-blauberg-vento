export class Device {
  constructor(
    public readonly ip: string,
    public readonly deviceId: string,
    public readonly name: string,
    public readonly password: string,
  ) {
  }
}
