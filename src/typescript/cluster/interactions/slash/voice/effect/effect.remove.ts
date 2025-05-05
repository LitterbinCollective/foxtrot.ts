import { Constants as DetritusConstants } from 'detritus-client';

import { listEffects } from '@cluster/utils';
import app from '@cluster/index';

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
      ctx.voice.effects.list
    );
    embed.setTitle(
      app.emoji('MINUS') +
        ' ' +
        (await this.t(ctx, 'commands.effect.remove', effect))
    );
    ctx.editOrRespond({ embed });
  }
}
