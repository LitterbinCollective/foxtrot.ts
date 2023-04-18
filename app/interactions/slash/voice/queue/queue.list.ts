import { Utils } from 'detritus-client';

import { PaginatorsStore } from '@/modules/stores';
import { MediaServiceResponseInformation } from '@/modules/managers/mediaservices/types';
import {
  Constants,
  durationInString,
  Paginator,
  UserError,
} from '@/modules/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';
export class QueueListCommand extends BaseVoiceCommandOption {
  public name = 'list';
  public description = 'list queue';

  public async run(ctx: VoiceInteractionContext) {
    const { info } = ctx.voice.queue;
    if (info.length === 0) throw new UserError('commands.queue.nothing');

    const pages = [];
    while (info.length)
      pages.push(info.splice(0, Constants.QUEUE_PAGE_ITEMS_MAXIMUM));

    const titleTemplate = (...values: any[]) =>
      this.t(ctx, 'commands.queue.paginator', ...values);

    const paginator = PaginatorsStore.create(ctx, {
      pages,
      async onEmbed(
        this: Paginator,
        page: MediaServiceResponseInformation[],
        embed: Utils.Embed
      ) {
        embed.setTitle(await titleTemplate(embed.title));
        const description = page
          .map((info, k) => {
            const position =
              this.currentPage * Constants.QUEUE_PAGE_ITEMS_MAXIMUM + k + 1;
            const duration = Utils.Markup.codestring(
              durationInString(info.duration)
            );
            const suffix = info.metadata ? ` - ${info.metadata.name}` : '';
            return `${position}) ${duration} ${info.title}` + suffix;
          })
          .join('\n');
        embed.setDescription(description);
      },
    });
    await paginator.start();
  }
}
