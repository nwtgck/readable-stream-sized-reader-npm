export class ReadableStreamSizedReader implements ReadableStreamDefaultReader<Uint8Array> {
  private buff: Uint8Array | undefined;

  constructor(private readonly reader: ReadableStreamDefaultReader) { }

  get closed(): Promise<void> {
    return this.reader.closed;
  }

  cancel(reason?: any): Promise<void> {
    return this.reader.cancel(reason);
  }

  releaseLock(): void {
    this.reader.releaseLock();
  }

  private async _read(size: number) {
    const { value, done } = await this.reader.read();
    if (done) {
      return { value: undefined, done: true };
    }
    if (value.byteLength <= size) {
      return { value, done };
    }
    this.buff = value.slice(size);
    return value.slice(0, size);
  }

  async read(size?: number): Promise<ReadableStreamReadResult<Uint8Array>> {
    if (size === undefined) return this.reader.read();

    // If no buffer
    if (this.buff === undefined) {
      return this._read(size);
    } else {
      // If buffer is enough to return
      if (this.buff.byteLength >= size) {
        const ret = this.buff.slice(0, size);
        this.buff = this.buff.slice(size);
        return { value: ret, done: false };
      }
      return this._read(size);
    }
  }
}
