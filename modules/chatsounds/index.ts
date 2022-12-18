/*
  rewrite the entire (Neo)Chatsounds system in TypeScript:
  - should probably use a child process (ffmpeg)
  - parser should support legacy modifiers
  - parser should not crash the bot
*/

import fs from 'fs';
import Sh from 'sh';

import { SHAT_FILENAME } from '@/modules/utils/constants';

interface Repository {
  branch: string
  base: string
  useMsgPack: boolean
}

interface Repositories {
  [repositoryName: string]: Repository
}

export class Chatsounds {
  constructor(repositories: Repositories) {

  }
}

// This is temporary!
export default new Sh(JSON.parse(fs.readFileSync(SHAT_FILENAME).toString()));