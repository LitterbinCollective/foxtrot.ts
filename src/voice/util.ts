import { Transform, TransformCallback } from 'stream'

export class Skip extends Transform {
  public src: any
  private offset: number

  constructor (options: any) {
    super(options)
    this.offset = options.offset
    this.on('pipe', (src) =>
      this.src = src
    )
  }

  _transform(chunk: any, _: BufferEncoding, callback: TransformCallback): void {
    if (this.offset === 0)
      this.push(chunk)
    else if (this.offset > chunk.length)
      this.offset -= chunk.length
    else {
      if (this.offset !== chunk.length) this.push(chunk.slice(this.offset))
      this.offset = 0
    }
    callback()
  }
}