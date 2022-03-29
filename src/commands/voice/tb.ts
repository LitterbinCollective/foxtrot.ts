import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'
import TalkingBenVoiceModule from '../../voice/modules/talkingBen'

export default class TBCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'tb',
      aliases: ['talkingben', 'ben'],
      args: [
        { name: 'stop', type: CommandArgumentTypes.BOOL, default: false }
      ]
    })
  }

  public async run (ctx: Context, { stop }: ParsedArgs) {
    const res = this.commandClient.application.voices.get(ctx.guild.id)
    if (!res) { return await ctx.reply('Not in the voice channel.') }
    if (res.channel !== ctx.member.voiceChannel) { return await ctx.reply('You are not in the voice channel this bot is currently in.') }
    if (!res.initialized)
      return await ctx.reply('Voice not yet initialized!')

    if (!res.module) {
      new TalkingBenVoiceModule(res)
    } else {
      if (res.module.constructor.name !== 'TalkingBenVoiceModule')
        return await ctx.reply('Another module active! Disable it first.');
      if (stop) {
        const result = res.module.destroy()
        if (!result) { return await ctx.reply("Can't destroy yet!") }
        return await ctx.reply('Good bye.')
      }

      return await ctx.reply('Talking Ben already talking!')
    }
  }
}
