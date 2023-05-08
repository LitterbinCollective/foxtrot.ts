import { Constants } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class VolumeCommand extends BaseVoiceSlashCommand {
  public name = 'packetloss';
  public description =
    'get/set packet loss percentages (simulate packet loss)';

  constructor() {
    super({
      options: [
        {
          name: 'percent',
          description: 'packet loss in percentages.',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { percent }: { percent?: number }
  ) {
    if (!ctx.guild) return;
    if (percent !== undefined) ctx.voice.pipeline.packetLoss = percent;

    ctx.editOrRespond(
      await this.t(ctx, 'commands.current-packet-loss', ctx.voice.pipeline.packetLoss)
    );
  }
}
