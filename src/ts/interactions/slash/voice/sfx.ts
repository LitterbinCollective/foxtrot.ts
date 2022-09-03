import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { InteractionContextExtended } from '../../base';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../../stores';

export default class SfxCommand extends BaseVoiceCommand {
  public name = 'sfx';
  public description = 'Play sound effects in voice channel.';

  constructor() {
    super({
      options: [
        {
          name: 'script',
          description: 'Soundeffects to play',
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: InteractionContextExtended, { script }: { script: string }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.playSoundeffect(script);
    ctx.editOrRespond('Okay, playing ' + Markup.codestring(script));
  }
}