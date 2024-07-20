import { CommandClient } from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';

import { BaseVoiceCommand, VoiceContext } from './base';

export default class CurrentlyPlayingCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'current',
      aliases: ['c', 'curplay', 'nowplaying', 'np'],
    });
  }

  public async run(ctx: VoiceContext) {
    let options: string | RequestTypes.CreateMessage = await this.t(
      ctx,
      'commands.nothing-is-playing'
    );

    if (ctx.voice.isPlaying)
      options = ctx.voice.queue.announcer.play(
        undefined,
        true
      ) as RequestTypes.CreateMessage;

    ctx.reply(options);
  }
}
