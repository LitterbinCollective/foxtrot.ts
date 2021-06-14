import { Context } from 'detritus-client/lib/command';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';
import { Voice } from '../../voice';

export default class JoinCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'join',
      aliases: ['connect', 'j'],
    });
  }

  public async run(ctx: Context) {
    if (!ctx.member.voiceChannel)
      return ctx.reply('You are not in the voice channel.');

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (res) {
      if (res.channel === ctx.member.voiceChannel)
        return ctx.reply('Already here.');
      return ctx.reply('Already in a voice channel on this server.');
    }

    new Voice(this.commandClient.application, ctx.member.voiceChannel);
  }
}
