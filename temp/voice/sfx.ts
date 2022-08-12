import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class SfxCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'sfx',
      aliases: ['saysound'],
      type: CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: Context, { sfx }: ParsedArgs) {
    if (!ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the voice channel.');
    }

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) return await ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the correct voice channel.');
    }
    if (!res.initialized) return await ctx.reply('Voice not yet initialized!');

    res.playSoundeffect(sfx);
  }
}
