import { Constants } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class QueueRemoveCommand extends BaseVoiceCommandOption {
  public name = 'remove';
  public description = 'remove item from the queue';

  constructor() {
    super({
      options: [
        {
          name: 'id',
          description: '# of the item in the queue',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: VoiceInteractionContext, { id }: { id: number }) {
    if (!ctx.guild) return;

    const deleted = ctx.voice.queue.delete(id - 1);
    ctx.editOrRespond(
      await this.t(ctx, 'commands.queue.remove', deleted.info.title)
    );
  }
}
