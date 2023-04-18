import { CommandClient } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectClearCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e clear',
      aliases: ['effect clear', 'e clr', 'effect clr'],
    });
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.effects.clearEffects();
    ctx.reply(await this.t(ctx, 'commands.effect.clear'));
  }
}
