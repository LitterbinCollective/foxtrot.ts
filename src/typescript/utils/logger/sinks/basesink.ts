import { LogLevel } from '../constants';

export default abstract class BaseSink {
  public abstract all: boolean;

  public abstract print(module: string, date: Date, level: LogLevel, ...data: any[]): any;
}