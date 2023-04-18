import { Constants, Utils } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class CorruptRandSampleCommand extends BaseVoiceCommandOption {
  public name = 'rand-sample';
  public description = 'set/get value to use when manipulating samples';

  constructor() {
    super({
      options: [
        {
          name: 'value',
          description: 'value (0 for random)',
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
    if (value) ctx.voice.corruptRandSample = value;

    return ctx.editOrRespond(
      await this.t(
        ctx,
        'commands.corrupt.current-rand-sample',
        ctx.voice.corruptRandSample
      )
    );
  }
}
