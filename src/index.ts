import {mergeUint8Arrays} from "binconv/dist/src/mergeUint8Arrays";

export class ReadableStreamSizedReader implements ReadableStreamDefaultReader<Uint8Array> {
  private buff: Uint8Array | undefined;
  private done: boolean = false;

  constructor(private readonly reader: ReadableStreamDefaultReader<Uint8Array>) { }

  get closed(): Promise<undefined> {
    return this.reader.closed;
  }

  cancel(reason?: any): Promise<void> {
    return this.reader.cancel(reason);
  }

  releaseLock(): void {
    this.reader.releaseLock();
  }

  private async readUp(size: number): Promise<ReadableStreamDefaultReadResult<Uint8Array>> {
    const values: Uint8Array[] = this.buff === undefined ? [] : [this.buff];
    let totalLen: number = this.buff === undefined ? 0 : this.buff.byteLength;
    this.buff = undefined;
    while (true) {
      const result = await this.reader.read();
      if (result.done) {
        if (values.length === 0) return result;
        this.done = true;
        return {
          value: mergeUint8Arrays(values),
          done: false
        };
      }
      totalLen += result.value.byteLength;
      values.push(result.value);
      if (totalLen >= size) {
        const merged = mergeUint8Arrays(values);
        if (totalLen > size) this.buff = merged.slice(size);
        return {
          value: merged.slice(0, size),
          done: false
        };
      }
    }
  }

  /**
   * Read n size bytes
   * @param size
   * @param readAsPossible If true, read n size bytes as possible. If false, read() is called() at most once internally.
   */
  async read(size?: number, readAsPossible: boolean = true): Promise<ReadableStreamDefaultReadResult<Uint8Array>> {
    if (this.done) return {value: undefined, done: true};
    if (size === undefined) {
      if (this.buff === undefined) return this.reader.read();
      const value = this.buff;
      this.buff = undefined;
      return { value,  done: false };
    }

    // If not read as possible and buffer exists
    if (!readAsPossible) {
      // If buffer is empty
      if (this.buff === undefined) {
        const result = await this.reader.read();
        if (result.done) return result;
        this.buff = result.value;
      }
      if (this.buff.byteLength > size) {
        const result = { value: this.buff.slice(0, size), done: false } as const;
        this.buff = this.buff.slice(size);
        return result;
      }
      const value = this.buff;
      this.buff = undefined;
      return { value, done: false };
    }

    // If buffer exists and it is enough to return
    if (this.buff !== undefined && this.buff.byteLength >= size) {
      const ret = this.buff.slice(0, size);
      this.buff = this.buff.slice(size);
      return { value: ret, done: false };
    }

    return this.readUp(size);
  }
}
