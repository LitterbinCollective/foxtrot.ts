import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectClearCommand extends BaseVoiceCommandOption {
  public name = 'clear';
  public description = 'clear effects';

  public async run(ctx: VoiceInteractionContext) {
    ctx.voice.effects.clearEffects();
    ctx.editOrRespond(await this.t(ctx, 'commands.effect.clear'));
  }
}
