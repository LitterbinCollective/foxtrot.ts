export const ANSI_ESCAPE = '\u001b';
export enum COLORS {
  BLUE = '[34m',
  GRAY = '[30;1m',
  GREEN = '[32m',
  RED = '[31m',
  RESET = '[0m',
  YELLOW = '[33m',
}
export const COLOR_REGEX = /\u001b\[(?:\d*;){0,5}\d*m/g;
export enum LOG_LEVEL_COLOR_MAPPINGS {
  DEBUG = 'GREEN',
  ERROR = 'RED',
  INFO = 'BLUE',
  LOG = 'GRAY',
  WARN = 'YELLOW',
}
export enum LOG_LEVELS {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  LOG = 4,
  DEBUG = 5,
}
