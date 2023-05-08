import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class VolumeCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'packetloss',
      aliases: ['pl', 'packet'],
      label: 'packetLoss',
      required: false,
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { packetLoss }: { packetLoss: number }) {
    if (!isNaN(packetLoss))
      ctx.voice.pipeline.packetLoss = packetLoss;

    return await ctx.reply(
      await this.t(ctx, 'commands.current-packet-loss', ctx.voice.pipeline.packetLoss)
    );
  }
}
