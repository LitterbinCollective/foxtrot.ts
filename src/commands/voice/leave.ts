import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class LeaveCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'leave',
      aliases: ['l', 'gtfo', 'stop']
    })
  }

  public async run (ctx: Context) {
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) { return await ctx.reply('Already gone.') }
    if (res.channel !== ctx.member.voiceChannel && res.channel.members.size !== 1) {
      return await ctx.reply('You are not in the voice channel this bot is currently in.')
    }

    res.kill()
    return await ctx.reply('Gone.')
  }
}
