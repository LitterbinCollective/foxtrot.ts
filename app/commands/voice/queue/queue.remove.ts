import { CommandClient, Constants, Utils } from 'detritus-client';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class QueueRemoveCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'queue remove',
      aliases: ['q remove', 'queue rm', 'q rm'],
      label: 'id',
      type: Constants.CommandArgumentTypes.NUMBER,
      required: true,
    });
  }

  public async run(ctx: VoiceContext, { id }: { id: number }) {
    const deleted = ctx.voice.queue.delete(id - 1);
    ctx.reply(
      `Removed ${Utils.Markup.codestring(deleted.info.title)} from the queue`
    );
  }
}
