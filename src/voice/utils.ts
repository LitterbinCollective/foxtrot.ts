import { PassThrough, Transform } from 'stream';

export class Rewindable extends Transform {
  private accumulator = [];

  constructor() {
    super();
    this.accumulator = [];
  }

  _transform(buf: any, _enc, cb) { 
    this.accumulator.push(buf);
    cb()
  }

  rewind() {
    const stream = new PassThrough();
    this.accumulator.forEach((chunk) => stream.write(chunk));
    stream.end();
    return stream;
  }
}