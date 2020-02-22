export class ReadableStreamSizedReader implements ReadableStreamDefaultReader<Uint8Array> {
  private buff: Uint8Array | undefined;

  constructor(private readonly reader: ReadableStreamDefaultReader<Uint8Array>) { }

  get closed(): Promise<void> {
    return this.reader.closed;
  }

  cancel(reason?: any): Promise<void> {
    return this.reader.cancel(reason);
  }

  releaseLock(): void {
    this.reader.releaseLock();
  }

  private async _read(size: number): Promise<ReadableStreamReadResult<Uint8Array>> {
    const result = await this.reader.read();
    if (result.done) {
      return { value: undefined, done: true };
    }
    if (result.value.byteLength <= size) {
      return result;
    }
    this.buff = result.value.slice(size);
    return {
      value: result.value.slice(0, size),
      done: false
    };
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
