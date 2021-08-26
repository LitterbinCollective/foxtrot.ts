import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class LeaveCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'leave',
      aliases: ['l', 'gtfo']
    })
  }

  public async run (ctx: Context) {
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) { return await ctx.reply('Not in the voice channel.') }
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel this bot is currently in.') }

    res.kill()
    return await ctx.reply('Gone.')
  }
}
