import { Constants as DetritusConstants, Utils } from 'detritus-client';

import { Constants, listEffects } from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectRemoveCommand extends BaseVoiceCommandOption {
  public name = 'remove';
  public description = 'remove the specified effect from the effect stack';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: DetritusConstants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { effect }: { effect: number }
  ) {
    if (!ctx.guild) return;
    ctx.voice.effects.removeEffect(effect);
    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list,
      ctx.voice.effects.STACK_LIMIT
    );
    embed.setTitle(
      Constants.EMOJIS.MINUS +
        ' ' +
        (await this.t(ctx, 'commands.effect.remove', effect))
    );
    ctx.editOrRespond({ embed });
  }
}
