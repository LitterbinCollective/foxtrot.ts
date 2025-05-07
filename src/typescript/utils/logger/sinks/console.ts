import * as Sentry from '@sentry/node';

import { LogLevel } from '../constants';
import BaseSink from './basesink';

const ANSI_ESCAPE = '\u001b';
enum COLORS {
  BG_BLUE = '[44m',
  BG_GRAY = '[100m',
  BG_GREEN = '[42m',
  BG_RED = '[41m',
  BG_YELLOW = '[43m',
  BRIGHT = '[1m',
  DIM = '[2m',
  GRAY = '[90m',
  RESET = '[0m',
}
const COLOR_REGEX = /\u001b\[(?:\d*;){0,5}\d*m/g;
enum LOG_LEVEL_COLOR_MAPPINGS {
  DEBUG = 'BG_GREEN',
  ERROR = 'BG_RED',
  INFO = 'BG_BLUE',
  LOG = 'BG_GRAY',
  WARN = 'BG_YELLOW',
}

const LEVEL_IDENTATION = 5;

export default class ConsoleSink implements BaseSink {
  public all = false;
  public indentation = 20;

  constructor() {
    const { LOG_INDENTATION } = process.env;

    if (LOG_INDENTATION) {
      const userIndentation = +LOG_INDENTATION;

      if (!isNaN(userIndentation) && isFinite(userIndentation))
        this.indentation = userIndentation;
    }
  }

  public print(module: string, date: Date, level: LogLevel, ...data: any[]) {
    const key = level.toLowerCase() as keyof typeof console;

    let func: any;
    if (level in console && typeof console[key] === 'function')
      func = console[key];
    else
      func = console.log;

    let tag = this.formTagWithLevel(module, level);
    tag += ' '.repeat(
      Math.max(0, this.indentation - tag.replaceAll(COLOR_REGEX, '').length)
    );

    func.call(
      console,
      this.colorize('DIM', '[' + this.formatDate(date) + ']'),
      tag,
      ...data
    );
  }

  private formatDate(date: Date) {
    return date.toLocaleString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private formTagWithLevel(
    module: string,
    level: keyof typeof LOG_LEVEL_COLOR_MAPPINGS | LogLevel,
  ) {
    const color =
      LOG_LEVEL_COLOR_MAPPINGS[
        level as keyof typeof LOG_LEVEL_COLOR_MAPPINGS
      ] || 'GRAY';

    const indentation = LEVEL_IDENTATION - level.length + 2;
    const levelTag = this.colorize(
      color,
      ' '.repeat(Math.floor(indentation / 2)) +
      level.toLowerCase() +
      ' '.repeat(Math.ceil(indentation / 2))
    );

    return `${levelTag} ${this.colorize('BRIGHT', module)}`;
  }

  private getColor(color: keyof typeof COLORS) {
    return ANSI_ESCAPE + COLORS[color];
  }

  private colorize(
    color: keyof typeof COLORS,
    string: string,
    reset: boolean = true
  ) {
    let toReturn = this.getColor(color) + string;
    if (reset) toReturn += this.getColor('RESET');
    return toReturn;
  }

  public static sentryIgnore(breadcrumb: Sentry.Breadcrumb) {
    if (breadcrumb.category === 'console' && breadcrumb.message?.includes(ANSI_ESCAPE))
      return null;

    return breadcrumb;
  }
}