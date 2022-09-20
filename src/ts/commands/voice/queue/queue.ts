import { Context } from 'detritus-client/lib/command';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CatvoxCommandClient } from '../../../application';
import { QUEUE_PAGE_ITEMS_MAXIMUM } from '../../../constants';
import { PaginatorsStore, VoiceStore } from '../../../stores';
import { durationInString, Paginator } from '../../../utils';
import { VoiceFormatResponseInfo } from '../../../voice/managers';
import { BaseVoiceCommand } from '../base';

export default class QueueCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'queue',
      aliases: ['q'],
      priority: -1,
    });
  }

  public async run(ctx: Context) {
    if (!ctx.guild) return;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const { info } = voice.queue;
    if (info.length === 0)
      return ctx.reply('Nothing is in the queue.');

    const pages = [];
    while (info.length)
      pages.push(info.splice(0, QUEUE_PAGE_ITEMS_MAXIMUM));

    const paginator = PaginatorsStore.create(ctx, {
      pages,
      onEmbed(this: Paginator, page: VoiceFormatResponseInfo[], embed: Embed) {
        embed.setTitle('Queue - ' + embed.title);
        const description = page.map(
          (info, k) => {
            const position = (this.currentPage * QUEUE_PAGE_ITEMS_MAXIMUM + k + 1);
            const duration = Markup.codestring(durationInString(info.duration));
            const suffix = (info.submittee ? ` - ${info.submittee.mention}` : '');
            return `${position}) ${duration} ${info.title}` + suffix;
          }
        ).join('\n');
        embed.setDescription(description);
      },
    });
    await paginator.start();
  }
}
