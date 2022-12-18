import { Constants, Interaction, Utils } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class SfxCommand extends BaseVoiceSlashCommand {
  public name = 'sfx';
  public description = 'Play sound effects in voice channel.';

  constructor() {
    super({
      options: [
        {
          name: 'script',
          description: 'Soundeffects to play',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { script }: { script: string }
  ) {
    if (!ctx.guild) return;

    ctx.voice.playSoundeffect(script);
    ctx.editOrRespond('Playing ' + Utils.Markup.codestring(script));
  }
}
