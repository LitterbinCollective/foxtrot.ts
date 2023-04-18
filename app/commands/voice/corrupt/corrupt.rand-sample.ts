import { CommandClient, Constants, Utils } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class CorruptRandSampleCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'corrupt rand-sample',
      aliases: ['corrupt randsample', 'corrupt rs'],
      required: false,
      label: 'value',
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { value }: { value?: number }) {
    if (!ctx.guild) return;
    if (value) ctx.voice.corruptRandSample = value;

    return ctx.reply(
      await this.t(
        ctx,
        'commands.corrupt.current-rand-sample',
        ctx.voice.corruptRandSample
      )
    );
  }
}
