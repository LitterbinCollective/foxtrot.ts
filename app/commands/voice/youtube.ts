import { Command, CommandClient, Constants } from 'detritus-client';
import ytsr from 'ytsr';

import { getRandomIPv6, UserError } from '@/modules/utils';
import formats from '@/configs/formats.json';

import { BaseCommand } from '../base';
import { VoiceStore } from '@/modules/stores';

export default class YouTubeCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'youtube',
      aliases: ['yt'],
      label: 'query',
      required: true,
      type: Constants.CommandArgumentTypes.STRING,
      args: [
        {
          name: 'noqueue',
          aliases: [ 'nop', 'noplay', 'noq' ],
          type: Constants.CommandArgumentTypes.BOOL,
          default: false
        }
      ]
    });
  }

  public async run(ctx: Command.Context, { query, noqueue }: { query: string, noqueue: boolean }) {
    if (!ctx.guild || !ctx.member) return;
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
    if (voice && voice.initialized &&
      voice.canExecuteVoiceCommands(ctx.member)&& !noqueue) {
      voice.queue.push(first.url, ctx.message);
      message = 'Adding ' + first.url + ' to the queue.';
    }

    ctx.reply(message);
  }
};
