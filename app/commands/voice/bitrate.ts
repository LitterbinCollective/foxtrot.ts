import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class BitrateCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'bitrate',
      aliases: ['br', 'b'],
      label: 'bitrate',
      required: true,
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { bitrate }: { bitrate: number }) {
    ctx.voice.bitrate = bitrate;
  }
}
