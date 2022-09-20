import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';

export class QueueClearCommand extends BaseCommandOption {
  public name = 'clear';
  public description = 'Clear the queue.';

  public async run(ctx: InteractionContextExtended) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    voice.queue.clear();
    ctx.editOrRespond('Cleared queue.');
  }
}