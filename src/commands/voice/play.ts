import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';

export default class JoinCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'play',
      label: 'url',
      type: CommandArgumentTypes.STRING,
      required: true,
    });
  }

  public async run(ctx: Context, { url }: ParsedArgs) {
    if (!ctx.member.voiceChannel)
      return ctx.reply('You are not in the voice channel.');

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) return ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel)
      return ctx.reply('You are not in the correct voice channel.');

    try {
      res.playURL(url);
    } catch (err) {
      console.log(err);
    }
  }
}
