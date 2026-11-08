import * as Sentry from '@sentry/node';

import { LogLevel } from '../constants';
import BaseSink from './basesink';

const map: Record<LogLevel, Sentry.SeverityLevel> = {
  NONE: 'log',
  LOG: 'log',
  INFO: 'info',
  DEBUG: 'debug',
  WARN: 'warning',
  ERROR: 'error',
};

export default class SentrySink implements BaseSink {
  public all = true;

  public print(module: string, date: Date, level: LogLevel, ...data: any[]) {
    Sentry.addBreadcrumb({
      category: module,
      data: Object.assign({}, data.filter(x => typeof x !== 'string')),
      level: map[level],
      timestamp: date.getDate() / 1000,
      message: [ ...data ].join(' ')
    });
  }
}