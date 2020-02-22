// TODO: You should change this content.

import * as assert from 'power-assert';

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
    assert.deepStrictEqual(actual1, {done: false, value: new Uint8Array([1, 2, 3])});
    const actual2 = await reader.read();
    assert.deepStrictEqual(actual2, {done: false, value: new Uint8Array([4, 5])});
    const actual3 = await reader.read();
    assert.deepStrictEqual(actual3, {done: false, value: new Uint8Array([6, 7, 8, 9, 10])});
  });
});

describe('TODO', () => {
  it('1 should be 1', () => {
    assert.strictEqual(1, 1);
  });
});
