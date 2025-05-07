import { GatewayClientEvents, Structures } from 'detritus-client';
import { Timers } from 'detritus-utils';
import { join } from 'path';

import BaseManager, { BaseManagerOptions } from '@/managers';
import { t } from '@cluster/managers/i18n';
import Voice from '@/cluster/voice';

import { BaseTTSService } from './services/basettsservice';
import { Constants } from '@/utils';

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;

export class TTSManager extends BaseManager<BaseTTSService> {
  public pick?: string = 'yandex';
  public tellMessageAuthor = false;
  public tellJoinLeave = false;
  public voice?: Voice;
  private queue: Promise<any> = Promise.resolve(true);

  constructor(_?: BaseManagerOptions, rawImported?: Record<string, any>) {
    super(
      {
        create: true,
        logger: 'TTS',
        path: join(__dirname, 'services/'),
      },
      rawImported
    );
  }

  public async cleanMessage(message: Structures.Message) {
    if (!message.guild) throw new Error;

    let content = message.convertContent({
      guildSpecific: true,
      nick: true
    });

    const contains: string[] = [];
    if (message.attachments.size > 0)
      contains.push('attachments');

    if (message.embeds.length > 0)
      contains.push('embeds');

    let replaced = false;
    content = content.replace(URL_REGEX, () => {
      replaced = true;
      return '';
    });

    if (replaced)
      contains.push('urls');

    const translated = contains.length > 0
      ? ' (' + await t(message.guild, 'tts.content.' + contains.join('-')) + ')'
      : '';

    if (this.tellMessageAuthor) {
      const member = message.member;
      if (!member) throw new Error;

      const name = member.names[0];
      content = await t(message.guild, 'tts.say', name, content);
    }

    return content + translated;
  }

  private queueAdd(operation: () => Promise<any>) {
    return new Promise((resolve, reject) =>
      this.queue = this.queue
        .then(operation)
        .then(resolve)
        .catch(reject)
    );
  }

  private say(content: string) {
    if (!this.pick) return;

    this.logger.debug('say:', content);
    return this.queueAdd(async () => {
      if (!this.pick || !(this.pick in this.imported)) return;

      const service = this.imported[this.pick];
      const buffer = await service.generate(content);
      if (!buffer) return;

      if (this.voice) {
        this.voice.pipeline.playBuffer(buffer);

        // not recommended but it just works
        await Timers.sleep(1000 * buffer.length / (2 * Constants.OPUS_AUDIO_CHANNELS * Constants.OPUS_SAMPLE_RATE));
      }
    });
  }

  public async createMessage(payload: GatewayClientEvents.MessageCreate) {
    const content = await this.cleanMessage(payload.message);
    return await this.say(content);
  }

  public async voiceStateUpdate(payload: GatewayClientEvents.VoiceStateUpdate) {
    if (!payload.voiceState.member || !payload.voiceState.guild || !this.tellJoinLeave) return;

    const { member } = payload.voiceState;
    const name = member.names[0];

    let content = '';
    switch (true) {
      case payload.joinedChannel:
        content = await t(payload.voiceState.guild, 'tts.join', name);
      break;
      case payload.leftChannel:
        content = await t(payload.voiceState.guild, 'tts.leave', name);
      break;
    }

    if (!content.length) return;

    return await this.say(content);
  }
}

export default new TTSManager();