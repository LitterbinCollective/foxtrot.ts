import { Constants, Utils } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class BitrateCommand extends BaseVoiceSlashCommand {
  public name = 'bitrate';
  public description = 'Change Opus bitrate.';

  constructor() {
    super({
      options: [
        {
          name: 'bitrate',
          description: 'Bitrate value',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { bitrate }: { bitrate: number }
  ) {
    if (!ctx.guild) return;

    ctx.voice.bitrate = bitrate;
    ctx.editOrRespond(
      'Set bitrate to ' +
        Utils.Markup.codestring(ctx.voice.bitrate.toString()) +
        '.'
    );
  }
}
