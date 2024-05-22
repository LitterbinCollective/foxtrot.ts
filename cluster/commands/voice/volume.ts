import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class VolumeCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'volume',
      aliases: ['v'],
      label: 'volume',
      required: false,
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { volume }: { volume: number }) {
    if (!isNaN(volume)) ctx.voice.pipeline.volume = volume;

    return await ctx.reply(
      await this.t(ctx, 'commands.current-volume', ctx.voice.pipeline.volume)
    );
  }
}
