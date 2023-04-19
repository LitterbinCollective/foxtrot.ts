export const APPLICATION_NAME = 'foxtrot';

export enum EMBED_COLORS {
  DEFAULT = 0xf9d158,
  ERROR = 0xe00d61,
  WARNING = 0xe0af0d,
}

export enum EMOJIS {
  OK = '👌',
  RADIO = '🔘',
  STOPWATCH = '⏱️',
  PLUS = '➕',
  MINUS = '➖',
  CHECK = '✅',
  BOMB = '💣',
  QUESTION_MARK = '❓',
  LINK = '🔗',
  SATELLITE = '📡',
  SOON = '🔜',

  PLAY = '▶️',
  FAST_REVERSE = '⏪',
  FAST_FORWARD = '⏩',
  PREVIOUS = '⏮',
  NEXT = '⏭',
  STOP = '⏹',
}

export const YOUTUBE_APPLICATION_ID = '880218394199220334';
export const QUEUE_PAGE_ITEMS_MAXIMUM = 9;
export const EMBEDDED_APPLICATION = 2;
export const FILENAME_REGEX = /\.[^/.]+$/;
export const CORRUPT_VOLUME_ON_ENABLE = 10;

export enum EXTERNAL_IPC_OP_CODES {
  STOP_MANAGER = 8,
  SHARE_SHAT = 9,
}

export enum CorruptModeMappings {
  add = 0,
  shiftl = 1,
  shiftr = 2,
  or = 3,
  and = 4,
  xor = 5,
  not = 6,
}
