export enum LOG_LEVELS {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  LOG = 4,
  DEBUG = 5,
}
export type LogLevel = keyof typeof LOG_LEVELS;
