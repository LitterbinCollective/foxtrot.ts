import { Command, CommandClient } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseCommand } from '../base';

export default class JoinCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'join',
      aliases: ['connect', 'j'],
    });
  }

  public async run(ctx: Command.Context) {
    if (!ctx.member || !ctx.guild || !ctx.channel) return;
    if (!ctx.member.voiceChannel)
      return ctx.reply(
        'You are not connected to any voice channel on this server.'
      );

    try {
      VoiceStore.create(ctx.member.voiceChannel, ctx.channel);
    } catch (err: any) {
      if (err instanceof Error)
        return ctx.reply(err.message);
      else
        throw err;
    }

    return await ctx.reply(Math.random() > 0.95 ? 'Oh hi Mark.' : 'Hi.');
  }
}
