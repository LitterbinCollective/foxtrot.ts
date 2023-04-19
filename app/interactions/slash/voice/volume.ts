import { Constants } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class VolumeCommand extends BaseVoiceSlashCommand {
  public name = 'volume';
  public description =
    'set mixer volume (currently playing media + sound effects)';

  constructor() {
    super({
      options: [
        {
          name: 'volume',
          description: 'volume in percentages. (100%, 200%)',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: false,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { volume }: { volume?: number }
  ) {
    if (!ctx.guild) return;
    if (volume !== undefined) ctx.voice.volume = volume;

    ctx.editOrRespond(
      await this.t(ctx, 'commands.current-volume', ctx.voice.volume)
    );
  }
}
