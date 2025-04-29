import sh from '@/cluster/chatsounds';

import { BaseTTSService } from './basettsservice';
import { Constants } from '@/utils';

export default class ChatsoundsTTSService extends BaseTTSService {
  public async generate(content: string) {
    const context = sh.worker(content);
    return await context.buffer({
      format: 's16le',
      sampleRate: Constants.OPUS_SAMPLE_RATE,
      audioChannels: Constants.OPUS_AUDIO_CHANNELS
    });
  }
}