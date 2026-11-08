import { Constants } from 'detritus-client';

import sox from '@cluster/managers/sox';
import { listEffects, UserError } from '@cluster/utils';
import app from '@cluster/index';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';
export class EffectAddCommand extends BaseVoiceCommandOption {
  public name = 'add';
  public description = 'add effects to the effect stack';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'effect to add',
          choices: Object.keys(sox.imported)
            .map(effect => ({ name: effect, value: effect })),
          required: false,
        },
        {
          name: 'spec',
          description: 'effect spec script (prioritized over effect)',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: false,
        }
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { effect, spec }: { effect: string, spec: string }
  ) {
    if (!ctx.guild) return;

    const general = spec || effect;
    if (!general)
      throw new UserError('commands.effect.no-effect');

    const [ id, single ] = ctx.voice.effects.newAddEffect(general);
    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list
    );

    embed.setTitle(
      app.emoji('PLUS') +
        ' ' +
        (await this.t(ctx, 'commands.effect.add.' + (single ? 'single' : 'multiple'), general))
    );

    if (single) { // ?
      const { name } = ctx.voice.effects.getEffectInfo(id);
      embed.setFooter(await this.t(ctx, 'commands.effect.effect-id', id, name));
    }

    ctx.editOrRespond({ embed });
  }
}
