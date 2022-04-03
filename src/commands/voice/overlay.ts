import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class OverlayCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'overlay',
      aliases: ['ov'],
      label: 'queueId',
      type: CommandArgumentTypes.NUMBER,
      required: true
    })
  }

  public async run (ctx: Context, { queueId }: ParsedArgs) {
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) { return await ctx.reply('Not in the voice channel.') }
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel this bot is currently in.') }
    if (!res.initialized)
      return await ctx.reply('Voice not yet initialized!')
    if (queueId === NaN) { return await ctx.reply('Invalid queue id!') }

    res.startOverlaying(queueId)
  }
}
