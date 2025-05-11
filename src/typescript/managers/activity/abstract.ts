export default abstract class AbstractActivity {
  public abstract ms: number;
  public abstract instant: boolean;

  public abstract run(): any | Promise<any>;

  public timeout: NodeJS.Timeout | null = null;

  constructor() {
    this.run = this.run.bind(this);
  }

  public start() {
    this.timeout = setInterval(this.run, this.ms);
    if (this.instant)
      this.run();
  }

  public stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
      this.timeout = null;
    }
  }
}