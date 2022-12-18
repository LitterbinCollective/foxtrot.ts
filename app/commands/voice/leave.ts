import { Command, CommandClient } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';

import { BaseCommand } from '../base';
import { VoiceContext } from './base';

export default class LeaveCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'leave',
      aliases: ['l', 'gtfo', 'stop'],
    });
  }

  public async onBeforeRun(ctx: Command.Context): Promise<boolean> {
    if (!ctx.member || !ctx.guild) return false;

    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) {
      await ctx.reply('Not in the voice channel.');
      return false;
    }

    if (!voice.canLeave(ctx.member)) {
      await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
      return false;
    }

    (ctx as VoiceContext).voice = voice;

    return true;
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.kill();
    return await ctx.reply('Gone.');
  }
}
