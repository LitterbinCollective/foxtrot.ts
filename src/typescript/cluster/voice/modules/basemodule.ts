import { OpusEncoder } from '@discordjs/opus';
import EventEmitter from 'events';

import { Mixer } from '@cluster/mixer';
import { Constants, Logger } from '@cluster/utils';

import Voice from '..';

const charCode = (x: string) => x.charCodeAt(0);
const OPUS_HEAD = Buffer.from([...'OpusHead'].map(charCode));
const OPUS_TAGS = Buffer.from([...'OpusTags'].map(charCode));

export default class BaseModule extends EventEmitter {
  public logger: Logger;
  public voice: Voice;
  private packets: Record<string, number> = {};
  private mixer?: Mixer;
  private opus?: OpusEncoder;

  constructor(voice: Voice) {
    super();
    this.voice = voice;
    this.logger = new Logger(this.constructor.name);

    this.receivePacket = this.receivePacket.bind(this);
  }

  private receivePacket({ data, userId }: any) {
    if (!this.opus || !this.mixer) return;

    if (this.packets[userId] === undefined)
      this.packets[userId] = 0;

    const signature = data.slice(0, 8);
    if (data.length >= 8 && (signature === OPUS_HEAD || signature === OPUS_TAGS))
      return;

    try {
      const decoded = this.opus.decode(data);
      this.mixer.addReadable(
        Buffer.concat([
          Buffer.alloc((Constants.OPUS_REQUIRED_SAMPLES) * this.packets[userId]),
          decoded
        ])
      );
    } catch (err) {}
    this.packets[userId]++;
  }

  public useVoiceReceiver() {
    if (this.mixer || this.opus) return;
    this.logger.debug('used voice receiver');
    this.mixer = new Mixer();
    this.opus = new OpusEncoder(Constants.OPUS_SAMPLE_RATE, Constants.OPUS_AUDIO_CHANNELS);

    // this.voice.pipeline.sendEmptyOpusPacket();
    this.voice.pipeline.on('receive', this.receivePacket);
  }

  public unuseVoiceReceiver() {
    this.logger.debug('unused voice receiver');
    this.voice.pipeline.off('receive', this.receivePacket);

    delete this.mixer;
    delete this.opus;
  }

  public update(packet?: Buffer) {}

  public internalUpdate() {
    let packet;

    if (this.mixer) {
      packet = this.mixer.process(Buffer.alloc(Constants.OPUS_REQUIRED_SAMPLES));

      for (const userId in this.packets)
        this.packets[userId] = Math.max(this.packets[userId] - 1, 0);
    }

    this.update(packet);
  }

  public postAssign() {}

  public cleanUp() {}

  public internalCleanUp() {
    if (this.mixer && this.opus)
      this.unuseVoiceReceiver();

    this.cleanUp();
  }

  public action(line?: string) {}
}