import { CommandClient, Utils } from 'detritus-client';

import { PaginatorsStore, VoiceStore } from '@/modules/stores';
import { Constants, durationInString, Paginator } from '@/modules/utils';
import { VoiceFormatResponseInfo } from '@/modules/voice/managers';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class QueueCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'queue',
      aliases: ['q'],
      priority: -1,
    });
  }

  public async run(ctx: VoiceContext) {
    const { info } = ctx.voice.queue;
    if (info.length === 0) return ctx.reply('Nothing is in the queue.');

    const pages = [];
    while (info.length) pages.push(info.splice(0, Constants.QUEUE_PAGE_ITEMS_MAXIMUM));

    const paginator = PaginatorsStore.create(ctx, {
      pages,
      onEmbed(this: Paginator, page: VoiceFormatResponseInfo[], embed: Utils.Embed) {
        embed.setTitle('Queue - ' + embed.title);
        const description = page
          .map((info, k) => {
            const position =
              this.currentPage * Constants.QUEUE_PAGE_ITEMS_MAXIMUM + k + 1;
            const duration = Utils.Markup.codestring(durationInString(info.duration));
            const suffix = info.submittee ? ` - ${info.submittee.mention}` : '';
            return `${position}) ${duration} ${info.title}` + suffix;
          })
          .join('\n');
        embed.setDescription(description);
      },
    });
    await paginator.start();
  }
}
