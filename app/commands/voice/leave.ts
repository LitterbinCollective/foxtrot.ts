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
      await ctx.reply(await this.t(ctx, 'voice-check.bot-not-in-voice'));
      return false;
    }

    if (!voice.canLeave(ctx.member)) {
      await ctx.reply(await this.t(ctx, 'voice-check.member-not-in-voice'));
      return false;
    }

    (ctx as VoiceContext).voice = voice;

    return true;
  }

  public async run(ctx: VoiceContext) {
    ctx.voice.kill();
    return await ctx.reply(await this.t(ctx, 'commands.voice-leave'));
  }
}
