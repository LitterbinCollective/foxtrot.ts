export const ANSI_ESCAPE = '\u001b';

export enum COLORS {
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

export const COLOR_REGEX = /\u001b\[(?:\d*;){0,5}\d*m/g;

export enum LOG_LEVEL_COLOR_MAPPINGS {
  DEBUG = 'BG_GREEN',
  ERROR = 'BG_RED',
  INFO = 'BG_BLUE',
  LOG = 'BG_GRAY',
  WARN = 'BG_YELLOW',
}

export enum LOG_LEVELS {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  LOG = 4,
  DEBUG = 5,
}
