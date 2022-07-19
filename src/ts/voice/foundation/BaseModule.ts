import { EventEmitter } from 'events';

import NewVoice from '../new';

export default class BaseModule extends EventEmitter {
  public readonly voice: NewVoice;

  constructor(voice: NewVoice) {
    super();
    this.voice = voice;
  }

  public destroy() {
    return true;
  }
}
