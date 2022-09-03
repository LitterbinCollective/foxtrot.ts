import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';
import { listEffects } from '../../../../utils';

export class EffectListCommand extends BaseCommandOption {
  public name = 'list';
  public description = 'List effects.';

  public async run(ctx: InteractionContextExtended) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const embed = listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
    ctx.editOrRespond({ embed });
  }
}