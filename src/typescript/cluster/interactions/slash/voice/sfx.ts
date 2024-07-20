import { Constants, Interaction, Utils } from 'detritus-client';

import { VoiceStore } from '@cluster/stores';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class SfxCommand extends BaseVoiceSlashCommand {
  public name = 'sfx';
  public description = 'play sounds in voice channel';

  constructor() {
    super({
      options: [
        {
          name: 'script',
          description: 'soundeffects to play',
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

    await ctx.voice.playSoundeffect(script);
    ctx.editOrRespond(await this.t(ctx, 'commands.play-sfx', script));
  }
}
