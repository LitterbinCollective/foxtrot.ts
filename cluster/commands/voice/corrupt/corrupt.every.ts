import { CommandClient, Constants, Utils } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class CorruptEveryCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'corrupt every',
      aliases: ['corrupt infreq', 'corrupt e'],
      required: false,
      label: 'value',
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { value }: { value: number }) {
    if (!ctx.guild) return;
    if (!isNaN(value)) ctx.voice.pipeline.corruptEvery = value;

    return ctx.reply(
      await this.t(
        ctx,
        'commands.corrupt.current-infrequency',
        ctx.voice.pipeline.corruptEvery
      )
    );
  }
}
