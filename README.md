# readable-stream-sized-reader
[![CircleCI](https://circleci.com/gh/nwtgck/readable-stream-sized-reader-npm.svg?style=shield)](https://circleci.com/gh/nwtgck/readable-stream-sized-reader-npm)

ReadableStream Reader with specified byte length read()

## Usage

```js
const readable = ...; // ReadableStream, e.g. (await fetch("...")).body
const reader = new ReadableStreamSizedReader(readable.getReader());

while(true) {
  // Read 1024 bytes at most
  const { done, value } = await reader.read(1024);
  if (done) break;
  console.log('value:', value);
}
```

### Disable read-as-possible
By default, `.read(n)` reads n bytes as possible. When you use `await reader.read(1024, false)`, it read at most 1024 bytes, but sometimes the bytes can be less than 1024 bytes.
