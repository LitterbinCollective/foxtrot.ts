import { InteractionContextExtended } from '../../base';
import { VoiceStore } from '../../../stores';
import { BaseVoiceCommand } from './base';

export default class CurrentlyPlayingCommand extends BaseVoiceCommand {
  public name = 'current';
  public description = 'Currently playing track.';

  public async run(ctx: InteractionContextExtended) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    if (voice.isPlaying) {
      voice.queue.announcer.play();
      ctx.editOrRespond('Okay.');
    } else ctx.editOrRespond('Nothing is playing right now.');
  }
}
