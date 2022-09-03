import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { InteractionContextExtended } from '../../base';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../../stores';

export default class BitrateCommand extends BaseVoiceCommand {
  public name = 'bitrate';
  public description = 'Change Opus bitrate.';

  constructor() {
    super({
      options: [
        {
          name: 'bitrate',
          description: 'Bitrate value',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: InteractionContextExtended, { bitrate }: { bitrate: number }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.bitrate = bitrate;
    ctx.editOrRespond('Okay, set bitrate to ' + Markup.codestring(voice.bitrate.toString()) + '.');
  }
}