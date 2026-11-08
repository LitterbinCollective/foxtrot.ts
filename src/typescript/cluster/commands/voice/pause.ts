import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class PauseCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'pause',
      aliases: ['resume', 'pa', 'r'],
      priority: -1
    });
  }

  public run(ctx: VoiceContext) {
    ctx.voice.pause();
  }
}
