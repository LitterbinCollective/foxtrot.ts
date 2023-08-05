import { listEffects } from '@/modules/utils/shard-specific';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectListCommand extends BaseVoiceCommandOption {
  public name = 'list';
  public description = 'list effects';

  public async run(ctx: VoiceInteractionContext) {
    if (!ctx.guild) return;
    const embed = await listEffects(
      ctx.guild,
      ctx.voice.effects.list
    );
    ctx.editOrRespond({ embed });
  }
}
