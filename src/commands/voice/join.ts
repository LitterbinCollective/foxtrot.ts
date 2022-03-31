import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'
import { Voice } from '../../voice'

export default class JoinCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'join',
      aliases: ['connect', 'j']
    })
  }

  public async run (ctx: Context) {
    if (!ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel.') }

    let res = this.commandClient.application.voices.get(ctx.guild.id)
    if (res) {
      if (res.channel === ctx.member.voiceChannel) { return await ctx.reply('Already here.') }
      return await ctx.reply('Already in a voice channel on this server.')
    }

    res = new Voice(
      this.commandClient.application,
      ctx.member.voiceChannel,
      ctx.channel
    )
    res.once('initComplete', () => {
      try {
        res.addToQueue('resources/aotl.mp3')
      } catch (err) {
        console.log(err)
      }
    })
    return await ctx.reply(Math.random() > 0.95 ? 'Oh hi Mark.' : 'Hi.')
  }
}
