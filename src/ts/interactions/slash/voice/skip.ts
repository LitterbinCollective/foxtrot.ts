import { InteractionContextExtended } from '../../base';
import { BaseVoiceCommand } from './base';
import { VoiceStore } from '../../../stores';

export default class SkipCommand extends BaseVoiceCommand {
  public name = 'skip';
  public description = 'Skip currently playing media.';

  public async run(ctx: InteractionContextExtended) {
    if (!ctx.member || !ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.skip();
    ctx.editOrRespond('Skipped!');
  }
}