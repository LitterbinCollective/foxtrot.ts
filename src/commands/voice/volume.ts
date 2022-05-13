import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { GMCommandClient } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class VolumeCommand extends BaseCommand {
  constructor (commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'volume',
      aliases: ['v', 'vol'],
      type: CommandArgumentTypes.FLOAT
    })
  }

  public async run (ctx: Context, { volume }: ParsedArgs) {
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) { return await ctx.reply('Not in the voice channel.') }
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel this bot is currently in.') }
    if (!res.initialized)
      return await ctx.reply('Voice not yet initialized!')

    res.setVolume(volume);
  }
}
