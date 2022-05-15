import { EventEmitter } from 'events';
import { Voice } from '..';

export default class BaseModule extends EventEmitter {
  public readonly voice: Voice;

  constructor(voice: Voice) {
    super();
    this.voice = voice;

    this.voice.denyOnAudioSubmission = true;
    this.voice.kill(false);
    this.voice.module = this;
  }

  public destroy() {
    this.voice.kill(false);
    this.voice.denyOnAudioSubmission = false;
    this.voice.module = null;
    return true;
  }
}
