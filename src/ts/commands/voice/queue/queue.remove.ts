import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { VoiceStore } from '../../../stores';
import { BaseVoiceCommand } from '../base';

export default class QueueRemoveCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'queue remove',
      aliases: ['q remove', 'queue rm', 'q rm'],
      label: 'id',
      type: CommandArgumentTypes.NUMBER,
      required: true
    });
  }

  public async run(ctx: Context, { id }: { id: number }) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const deleted = voice.queue.delete(id - 1);
    ctx.reply(`Removed ${Markup.codestring(deleted.info.title)} from the queue`);
  }
}
