// these constants are used universally!

export const APPLICATION_NAME = 'foxtrot';

export const OPUS_FRAME_LENGTH = 20;
export const OPUS_FRAME_SIZE = 960;
export const OPUS_SAMPLE_BYTE_LEN = 2;
export const OPUS_AUDIO_CHANNELS = 2;
export const OPUS_SAMPLE_RATE = 48000;
export const OPUS_REQUIRED_SAMPLES =
  OPUS_FRAME_SIZE * OPUS_AUDIO_CHANNELS * OPUS_SAMPLE_BYTE_LEN;

export const VOICE_EFFECTS_STACK_LIMIT = 8;

export enum EMBED_COLORS {
  DEFAULT = 0xffee3e,
  ERROR = 0x511cff,
  WARNING = 0xe0af0d,
}

export enum EMOJIS {
  OK = '👌',
  RADIO = '🔘',
  PLUS = '➕',
  MINUS = '➖',
  CHECK = '✅',
  BOMB = '💣',
  QUESTION_MARK = '❓',
  LINK = '🔗',
  SATELLITE = '📡',
  SOON = '🔜',
  HOURGLASS = '⌛',
  PAPERCLIP = '📎',

  PLAY = '▶️',
  FAST_REWIND = '⏪',
  FAST_FORWARD = '⏩',
  PREVIOUS = '⏮',
  NEXT = '⏭',
  STOP = '⏹',
  PAUSE = '⏸️'
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
