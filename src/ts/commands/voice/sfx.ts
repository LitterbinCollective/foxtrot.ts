import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../application';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../stores';

export default class NSfxCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'sfx',
      aliases: ['saysound'],
      type: CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: Context, { sfx }: { sfx: string }) {
    if (!ctx.member || !ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.playSoundeffect(sfx);
  }
}
