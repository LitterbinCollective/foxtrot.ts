import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class QueueClearCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'queue clear',
      aliases: ['q clear', 'queue clr', 'q clr'],
    });
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.queue.clear();
    ctx.reply('Cleared queue.');
  }
}
