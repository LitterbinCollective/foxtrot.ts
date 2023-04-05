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
    if (bitrate) {
      ctx.voice.bitrate = bitrate;
      return await ctx.reply(
        'Set bitrate to ' +
          Utils.Markup.codestring(ctx.voice.bitrate.toString()) + '.'
      );
    }

    return await ctx.reply(
      'The current Opus encoder bitrate is ' +
        Utils.Markup.codestring(ctx.voice.bitrate.toString()) + '.'
    );
  }
}
