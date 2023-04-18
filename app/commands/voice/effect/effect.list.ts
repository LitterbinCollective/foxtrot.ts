import { CommandClient } from 'detritus-client';

import { listEffects } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectListCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e list',
      aliases: ['effect list', 'e ls', 'effect ls'],
    });
  }

  public async run(ctx: VoiceContext) {
    if (!ctx.guild) return;
    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list,
      ctx.voice.effects.STACK_LIMIT
    );
    ctx.reply({ embed });
  }
}
