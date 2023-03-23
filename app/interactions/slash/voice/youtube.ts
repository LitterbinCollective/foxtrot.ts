import { Constants, Interaction, } from 'detritus-client';
import ytsr from 'ytsr';

import { getRandomIPv6, UserError } from '@/modules/utils';
import { VoiceStore } from '@/modules/stores';
import formats from '@/configs/formats.json';

import { BaseSlashCommand } from '../../base';

export default class YouTubeCommand extends BaseSlashCommand {
  public name = 'youtube';
  public description = 'YouTube search';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search query.',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: 'noqueue',
          description: 'When true, the video will not be added to the voice queue.',
          type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
          default: false
        }
      ],
    });
  }

  public async run(
    ctx: Interaction.InteractionContext,
    { query, noqueue }: { query: string, noqueue: boolean }
  ) {
    if (!ctx.guild) return;
    let requestOptions = undefined;

    if (formats.youtube && formats.youtube.ipv6.length !== 0)
      requestOptions = {
        family: 6,
        localAddress: getRandomIPv6(formats.youtube.ipv6)
      };

    const filters = await ytsr.getFilters(query, { requestOptions } as any);

    let videos = filters.get('Type')?.get('Video');
    if (!videos)
      throw new UserError('not found');

    const res = await ytsr(query, { requestOptions } as any);

    const first = res.items[0] as ytsr.Video;
    let message = first.url;

    const voice = VoiceStore.get(ctx.guild.id);
    if (voice && voice.initialized && !noqueue) {
      voice.queue.push(first.url, ctx.user);
      message = 'Adding ' + first.url + ' to the queue.';
    }

    ctx.editOrRespond(message);
  }
}
