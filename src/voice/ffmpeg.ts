import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { Transform, Writable } from 'stream';

export default class FFMpeg extends Transform {
  public instance: ChildProcessWithoutNullStreams;
  public offsetTime: number = 0;
  public pauseTime: number;
  private readonly args: string[];
  private readonly bufferContainer: Buffer[] = [];
  private readonly pre: string[];
  private readonly url?: string;

  constructor(args: string[], pre: string[] = [], url?: string) {
    super();

    this.args = args;
    this.pre = pre;
    this.url = url;

    this.onEnd = this.onEnd.bind(this);
    this.ffmpegClose = this.ffmpegClose.bind(this);
    this.on('pipe', (src) => src.on('end', this.onEnd));
    this.on('unpipe', (src) => src.off('end', this.onEnd));

    this.setupFFMpeg();
  }

  private setupFFMpeg(args = this.args, pre = this.pre) {
    args.unshift('-i', this.url ? this.url : 'pipe:3');
    args = pre.concat(args);
    args.push('pipe:1');

    if (this.instance) {
      this.instance.off('close', this.ffmpegClose);
      this.instance.kill(9);
    }

    this.instance = spawn('ffmpeg', args, {
      stdio: ['inherit', 'pipe', 'inherit', 'pipe', 'pipe'],
    });

    this.instance.stdio[1].on('data', (chunk) => chunk && this.push(chunk));
    this.instance.on('close', this.ffmpegClose);
  }

  public _write(
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error) => void
  ): void {
    if ((this.instance.stdio[3] as Writable).writableEnded) return;
    (this.instance.stdio[3] as Writable).write(chunk, encoding, callback);
    this.bufferContainer.push(chunk);
  }

  private ffmpegClose() {
    this.end();
  }

  private onEnd() {
    (this.instance.stdio[3] as Writable).end();
    this.bufferContainer.push(null);
  }

  public destroy(error?: Error): void {
    super.destroy(error);
    if (this.instance.connected) this.instance.kill(9);
  }
}
