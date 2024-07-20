import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class ModuleDestroyCommand extends BaseVoiceCommandOption {
  public name = 'destroy';
  public description = 'get rid of the set voice module';

  public async run(ctx: VoiceInteractionContext) {
    ctx.voice.destroyModule();

    return await ctx.editOrRespond(
      await this.t(ctx, 'commands.module.destroy')
    );
  }
}