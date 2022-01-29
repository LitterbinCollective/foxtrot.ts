import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'
import { Voice } from '../../voice'

export default class PlayCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'play',
      label: 'url',
      type: CommandArgumentTypes.STRING,
      required: true,
      aliases: ['p']
    })
  }

  public async run (ctx: Context, { url }: ParsedArgs) {
    if (!ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel.') }

    let res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) {
      res = new Voice(
        this.commandClient.application,
        ctx.member.voiceChannel,
        ctx.channel
      )
      return res.once('initComplete', () => {
        try {
          res.playURL(url)
        } catch (err) {
          console.log(err)
        }
      })
    }
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel this bot is currently in.') }
    if (!res.initialized)
      return await ctx.reply('Voice not yet initialized!')

    try {
      res.playURL(url)
    } catch (err) {
      console.log(err)
    }
  }
}
