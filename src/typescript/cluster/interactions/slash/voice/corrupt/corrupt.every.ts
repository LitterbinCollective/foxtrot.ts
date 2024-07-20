import { Constants } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class CorruptEveryCommand extends BaseVoiceCommandOption {
  public name = 'every';
  public description = 'set/get corruption infrequency';

  constructor() {
    super({
      options: [
        {
          name: 'value',
          description: 'value',
          type: Constants.ApplicationCommandOptionTypes.NUMBER,
          required: false,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { value }: { value?: number }
  ) {
    if (!ctx.guild) return;
    if (value !== undefined) ctx.voice.pipeline.corruptEvery = value;

    return ctx.editOrRespond(
      await this.t(
        ctx,
        'commands.corrupt.current-infrequency',
        ctx.voice.pipeline.corruptEvery
      )
    );
  }
}
