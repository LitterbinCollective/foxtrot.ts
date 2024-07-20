import { CommandClient, Constants, Utils } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class BitrateCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'bitrate',
      aliases: ['br', 'b'],
      label: 'bitrate',
      required: false,
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { bitrate }: { bitrate?: number }) {
    if (bitrate)
      ctx.voice.pipeline.bitrate = bitrate;

    return await ctx.reply(
      await this.t(ctx, 'commands.current-bitrate', ctx.voice.pipeline.bitrate)
    );
  }
}
