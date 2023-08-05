import { Utils } from 'detritus-client';

import { VoiceEffectManager } from '@/modules/voice/managers';
import { Constants } from '@/modules/utils';
import { listEffects } from '@/modules/utils/shard-specific';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectAddCommand extends BaseVoiceCommandOption {
  public name = 'add';
  public description = 'add an effect to the effect stack';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: 'effect to add',
          choices: VoiceEffectManager.getArgumentType(),
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { effect }: { effect: string }
  ) {
    if (!ctx.guild) return;

    const id = ctx.voice.effects.addEffect(effect);
    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list
    );

    embed.setTitle(
      Constants.EMOJIS.PLUS +
        ' ' +
        (await this.t(ctx, 'commands.effect.add', effect))
    );

    embed.setFooter(await this.t(ctx, 'commands.effect.effect-id', id, effect));
    ctx.editOrRespond({ embed });
  }
}
