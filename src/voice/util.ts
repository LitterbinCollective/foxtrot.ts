import { Transform, TransformCallback } from 'stream';

export class Skip extends Transform {
  public src: any;
  private offset: number;

  constructor(options: any) {
    super(options);
    this.offset = options.offset;
    this.onPipe = this.onPipe.bind(this);
    this.on('pipe', this.onPipe);
  }

  private onPipe(src: any) {
    this.src = src;
  }

  public _transform(
    chunk: any,
    _: BufferEncoding,
    callback: TransformCallback
  ): void {
    if (this.offset === 0) this.push(chunk);
    else if (this.offset > chunk.length) this.offset -= chunk.length;
    else {
      if (this.offset !== chunk.length) this.push(chunk.slice(this.offset));
      this.offset = 0;
    }
    callback();
  }

  public kill() {
    this.off('pipe', this.onPipe);
    this.unpipe();
    this.destroy();
  }
}
