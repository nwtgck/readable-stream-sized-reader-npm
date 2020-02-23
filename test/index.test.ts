// TODO: You should change this content.

import * as assert from 'power-assert';
import {ReadableStreamSizedReader} from '../src';

function createReadableStream1(): ReadableStream {
  const arrays = [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5]),
    new Uint8Array([6, 7, 8, 9, 10]),
  ];
  let idx = 0;
  return new ReadableStream({
    pull(ctrl) {
      if (idx >= arrays.length) {
        ctrl.close();
        return;
      }
      ctrl.enqueue(arrays[idx]);
      idx++;
    },
  });
}

// NOTE: This is a test for test utility. Maybe it is better to mock .read()
describe('createReadableStream1()', () => {
  it('should be chunked', async () => {
    const readable = createReadableStream1();
    const reader = readable.getReader();

    const actual1 = await reader.read();
    assert.deepStrictEqual(actual1, { done: false, value: new Uint8Array([1, 2, 3]) });
    const actual2 = await reader.read();
    assert.deepStrictEqual(actual2, { done: false, value: new Uint8Array([4, 5]) });
    const actual3 = await reader.read();
    assert.deepStrictEqual(actual3, { done: false, value: new Uint8Array([6, 7, 8, 9, 10]) });
    const actual4 = await reader.read();
    assert.deepStrictEqual(actual4, { done: true, value: undefined });
  });
});

describe('ReadableStreamSizedReader.prototype.read', () => {
  it('should read specific size', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());

    {
      const actual = await reader.read(4);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([1, 2, 3, 4]) });
    }

    {
      const actual = await reader.read(4);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([5, 6, 7, 8]) });
    }

    {
      const actual = await reader.read(4);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([9, 10]) });
    }

    {
      const actual = await reader.read(4);
      assert.deepStrictEqual(actual, { done: true, value: undefined });
    }
  });

  // NOTE: for coverage
  it('should read specific size and return buffered bytes', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());

    {
      const actual = await reader.read(1);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([1]) });
    }

    {
      const actual = await reader.read(1);
      // NOTE: [2] should be already buffered
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([2]) });
    }
  });

  // NOTE: for coverage
  it('should done immediately when buffer is empty and read() returns done', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());
    // Read up everything
    await reader.read(10);
    const actual = await reader.read(10);
    assert.deepStrictEqual(actual, { done: true, value: undefined });
  });

  it('should read specific size and read without size together', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());

    {
      const actual = await reader.read(2);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([1, 2]) });
    }

    {
      // NOTE: read() without size
      const actual = await reader.read();
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([3]) });
    }

    {
      // NOTE: read() without size
      const actual = await reader.read();
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([4, 5]) });
    }

    {
      const actual = await reader.read(3);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([6, 7, 8]) });
    }

    {
      const actual = await reader.read(3);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([9, 10]) });
    }

    {
      const actual = await reader.read(3);
      assert.deepStrictEqual(actual, { done: true, value: undefined });
    }
  });

  it('should read() immediately when readAsPossible = false', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());
    {
      const actual = await reader.read(4, false);
      // At most 4 bytes, but 3 bytes are also fine
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([1, 2, 3]) });
    }

    {
      const actual = await reader.read(1, false);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([4]) });
    }

    {
      const actual = await reader.read(1, false);
      assert.deepStrictEqual(actual, { done: false, value: new Uint8Array([5]) });
    }

    {
      await reader.read(5, false);
      const actual = await reader.read(5, false);
      assert.deepStrictEqual(actual, { done: true, value: undefined });
    }
  });
});

describe('ReadableStreamSizedReader.prototype.closed', () => {
  it('should be fulfilled when read up everything', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());
    await reader.read(10);
    await reader.closed;
  });
});

describe('ReadableStreamSizedReader.prototype.cancel', () => {
  it('should be closed', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());
    await reader.cancel();
    await reader.closed;
  });
});

describe('ReadableStreamSizedReader.prototype.releaseLock', () => {
  it('should be called releaseLock', async () => {
    const readable = createReadableStream1();
    const reader = new ReadableStreamSizedReader(readable.getReader());
    reader.releaseLock();
  });
});
