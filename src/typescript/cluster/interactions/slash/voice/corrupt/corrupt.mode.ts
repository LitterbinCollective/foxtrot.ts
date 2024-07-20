import { Constants } from '@cluster/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

const choices = Object.keys(Constants.CorruptModeMappings)
  .map(x => (isNaN(+x) ? { name: x, value: x } : null))
  .filter(x => x !== null) as { name: string; value: string }[];

export class CorruptModeCommand extends BaseVoiceCommandOption {
  public name = 'mode';
  public description = 'set/get corruption mode';

  constructor() {
    super({
      options: [
        {
          name: 'mode',
          description: 'mode',
          choices,
          required: false,
        },
      ],
    });
  }

  public async run(ctx: VoiceInteractionContext, { mode }: { mode?: string }) {
    if (!ctx.guild) return;
    if (mode) ctx.voice.pipeline.corruptMode = mode;

    return ctx.editOrRespond(
      await this.t(ctx, 'commands.corrupt.current-mode', ctx.voice.pipeline.corruptMode)
    );
  }
}
