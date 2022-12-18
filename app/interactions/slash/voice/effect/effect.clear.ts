import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectClearCommand extends BaseVoiceCommandOption {
  public name = 'clear';
  public description = 'Clear effects.';

  public run(ctx: VoiceInteractionContext) {
    ctx.voice.effects.clearEffects();
    ctx.editOrRespond('Cleared effects.');
  }
}
