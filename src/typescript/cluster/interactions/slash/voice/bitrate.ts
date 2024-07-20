import { Constants } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class VolumeCommand extends BaseVoiceSlashCommand {
  public name = 'bitrate';
  public description =
    'get/set bitrate value in bps';

  constructor() {
    super({
      options: [
        {
          name: 'bitrate',
          description: 'bitrate value in bps.',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { bitrate }: { bitrate?: number }
  ) {
    if (!ctx.guild) return;
    if (bitrate !== undefined)
      ctx.voice.pipeline.bitrate = bitrate;

    ctx.editOrRespond(
      await this.t(ctx, 'commands.current-bitrate', ctx.voice.pipeline.bitrate)
    );
  }
}
