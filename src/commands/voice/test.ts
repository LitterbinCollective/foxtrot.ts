import { Context } from 'detritus-client/lib/command'
import * as fs from 'fs'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class TestCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'test'
    })
  }

  public async run (ctx: Context) {
    if (!ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel.') }

    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) return await ctx.reply('Not in the voice channel.')
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the correct voice channel.') }

    const file = fs.createReadStream('resources/test.mp3')
    res.addToQueue(file)
  }
}
