import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';

export class QueueRemoveCommand extends BaseCommandOption {
  public name = 'remove';
  public description = 'Remove item from the queue.';

  constructor() {
    super({
      options: [
        {
          name: 'id',
          description: '# of the item in the queue',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
      ],
    });
  }

  public async run(ctx: InteractionContextExtended, { id }: { id: number }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const deleted = voice.queue.delete(id - 1);
    ctx.editOrRespond(`Removed ${Markup.codestring(deleted.info.title)} from the queue`);
  }
}