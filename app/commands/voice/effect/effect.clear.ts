import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectClearCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e clear',
      aliases: ['effect clear', 'e clr', 'effect clr'],
    });
  }

  public run(ctx: VoiceContext) {
    ctx.voice.effects.clearEffects();
    ctx.reply('Cleared effects.');
  }
}
