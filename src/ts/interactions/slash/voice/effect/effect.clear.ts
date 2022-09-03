import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';

export class EffectClearCommand extends BaseCommandOption {
  public name = 'clear';
  public description = 'Clear effects.';

  public run(ctx: InteractionContextExtended) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.effects.clearEffects();
    ctx.editOrRespond('Cleared effects.');
  }
}