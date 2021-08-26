import { PassThrough, Transform } from 'stream'

export class Rewindable extends Transform {
  private readonly accumulator = []

  constructor () {
    super()
    this.accumulator = []
  }

  _transform (buf: any, _enc, cb) {
    this.accumulator.push(buf)
    cb()
  }

  rewind () {
    const stream = new PassThrough()
    this.accumulator.forEach((chunk, i) => {
      stream.write(chunk)
      if (i === this.accumulator.length - 1) { stream.end() }
    })
    return stream
  }
}
