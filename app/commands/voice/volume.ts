import { CommandClient, Constants } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class VolumeCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'volume',
      aliases: ['v'],
      label: 'volume',
      required: true,
      type: Constants.CommandArgumentTypes.NUMBER,
    });
  }

  public async run(ctx: VoiceContext, { volume }: { volume: number }) {
    ctx.voice.volume = volume / 100;
  }
}
