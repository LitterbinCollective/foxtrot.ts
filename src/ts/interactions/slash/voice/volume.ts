import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { InteractionContextExtended } from '../../base';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../../stores';

export default class VolumeCommand extends BaseVoiceCommand {
  public name = 'volume';
  public description = 'Set mixer volume. (currently playing media + sound effects)';

  constructor() {
    super({
      options: [
        {
          name: 'volume',
          description: 'Volume in percentages. (100%, 200%)',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: InteractionContextExtended, { volume }: { volume: number }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.volume = volume / 100;
    ctx.editOrRespond('Okay, set volume to ' + Markup.codestring(volume.toString() + '%'));
  }
}