import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class SkipCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'skip',
      aliases: ['s', 'next'],
    });
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.skip();
  }
}
