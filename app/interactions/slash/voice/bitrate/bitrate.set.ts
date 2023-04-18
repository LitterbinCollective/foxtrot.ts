import { Constants, Utils } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class BitrateSetCommand extends BaseVoiceCommandOption {
  public name = 'set';
  public description = 'set opus encoder bitrate (in bps)';

  constructor() {
    super({
      options: [
        {
          name: 'value',
          description: 'bitrate value in bps',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: VoiceInteractionContext, { value }: { value: number }) {
    if (!ctx.guild) return;

    ctx.voice.bitrate = value;
    ctx.editOrRespond(
      await this.t(ctx, 'commands.bitrate.set', ctx.voice.bitrate)
    );
  }
}
