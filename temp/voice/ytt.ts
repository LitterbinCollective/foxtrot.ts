import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import { EMBEDDED_APPLICATION, YOUTUBE_APPLICATION_ID } from '../../constants';

export default class YTTCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'ytt',
      aliases: ['yt', 'youtube', 'youtubetogether', 'yttogether'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the voice channel.');
    }

    const result = await ctx.client.rest.createChannelInvite(
      ctx.member.voiceChannel.id,
      {
        targetApplicationId: YOUTUBE_APPLICATION_ID,
        targetType: EMBEDDED_APPLICATION,
        maxAge: 86400,
        maxUses: 0,
        temporary: false,
      }
    );

    if (Number(result.code) === 50013) {
      return await ctx.reply(
        'Bot lacks permissions to create a YouTube Together invite.'
      );
    }

    return await ctx.reply(`https://discord.com/invite/${result.code}`);
  }
}
