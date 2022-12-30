import { Structures } from 'detritus-client';

import { BaseVoiceSlashCommand, VoiceInteractionContext } from './base';

export default class CurrentlyPlayingCommand extends BaseVoiceSlashCommand {
  public name = 'current';
  public description = 'Currently playing track.';

  public async run(ctx: VoiceInteractionContext) {
    let options: string | Structures.InteractionEditOrRespond =
      'Nothing is playing right now.';

    if (ctx.voice.isPlaying) {
      const createMessage = ctx.voice.queue.announcer.play(undefined, true);
      options = {
        embed: createMessage?.embed,
      };
    }

    ctx.editOrRespond(options);
  }
}
