import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class SfxCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'sfx',
      aliases: ['saysound'],
      type: Constants.CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: VoiceContext, { sfx }: { sfx: string }) {
    await ctx.voice.playSoundeffect(sfx);
  }
}
