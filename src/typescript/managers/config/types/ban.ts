// in case if our ToS is violated,

interface Global {
  block: boolean,
  blockMedia: boolean,

  message?: string,
}

export type Server = {
  annoy?: boolean,
  annoyChance?: number,
  annoyChatsound?: string,
  annoyEvery?: [ number, number ],

  volume?: number,

  autojoin?: boolean,
  annoyThreshold?: number,
} & Global;

export default interface ConfigSpecialSnowflakes {
  servers?: Record<string, Server | true>,
  users?: Record<string, Global | true>,
}