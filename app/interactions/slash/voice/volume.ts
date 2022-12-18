import { Constants, Utils } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class VolumeCommand extends BaseVoiceSlashCommand {
  public name = 'volume';
  public description =
    'Set mixer volume. (currently playing media + sound effects)';

  constructor() {
    super({
      options: [
        {
          name: 'volume',
          description: 'Volume in percentages. (100%, 200%)',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { volume }: { volume: number }
  ) {
    if (!ctx.guild) return;

    ctx.voice.volume = volume / 100;
    ctx.editOrRespond(
      'Okay, set volume to ' + Utils.Markup.codestring(volume.toString() + '%')
    );
  }
}
