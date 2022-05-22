import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class NSfxCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'nsfx',
      aliases: ['nsaysound'],
      type: CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: Context, { nsfx }: ParsedArgs) {
    if (!ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the voice channel.');
    }

    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return await ctx.reply('Not in the voice channel.');
    if (!voice.canCallVoiceCommands(ctx.member)) {
      return await ctx.reply('You are not in the correct voice channel.');
    }

    voice.playSoundeffect(nsfx);
  }
}