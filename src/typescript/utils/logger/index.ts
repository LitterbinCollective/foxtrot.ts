import { LOG_LEVELS } from './constants';
import BaseSink from './sinks/basesink';

import ConsoleSink from './sinks/console';
import SentrySink from './sinks/sentry';

export class Logger {
  public level: number = LOG_LEVELS.LOG;
  public sinks: BaseSink[] = [];
  private readonly module: string;

  constructor(module: string, level?: number) {
    this.module = module;

    const { LOG_LEVEL, NODE_ENV } = process.env;

    if (LOG_LEVEL) {
      const int = parseInt(LOG_LEVEL);

      if (int in LOG_LEVELS)
        this.level = int
      else if (LOG_LEVEL in LOG_LEVELS)
        this.level = LOG_LEVELS[LOG_LEVEL as keyof typeof LOG_LEVELS];
    } else if (NODE_ENV === 'development')
      this.level = LOG_LEVELS.DEBUG;

    if (level)
      this.level = level;
  }

  private print(level: keyof typeof LOG_LEVELS, ...data: any[]) {
    const date = new Date;

    const above = LOG_LEVELS[level] > this.level;
    for (const sink of this.sinks) {
      if (!sink.all && above)
        continue;
      sink.print(this.module, date, level, ...data);
    }
  }

  public clone(module: string, level?: number) {
    const logger = new Logger(module, level || this.level);
    logger.sinks = [ ...this.sinks ];

    return logger;
  }

  public debug(...data: any[]) {
    this.print.call(this, 'DEBUG', ...data);
  }

  public log(...data: any[]) {
    this.print.call(this, 'LOG', ...data);
  }

  public info(...data: any[]) {
    this.print.call(this, 'INFO', ...data);
  }

  public warn(...data: any[]) {
    this.print.call(this, 'WARN', ...data);
  }

  public error(...data: any[]) {
    this.print.call(this, 'ERROR', ...data);
  }
}

const logger = new Logger('Global');
logger.sinks.push(
  new ConsoleSink,
  new SentrySink
);

export default logger;