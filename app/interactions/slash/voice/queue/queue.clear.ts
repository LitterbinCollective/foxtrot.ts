import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class QueueClearCommand extends BaseVoiceCommandOption {
  public name = 'clear';
  public description = 'Clear the queue.';

  public async run(ctx: VoiceInteractionContext) {
    if (!ctx.guild) return;

    ctx.voice.queue.clear();
    ctx.editOrRespond('Cleared queue.');
  }
}
