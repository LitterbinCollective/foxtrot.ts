import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import GoogleAssistantVoiceModule from '../../voice/modules/googleAssistant';

export default class GACommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'ga',
      aliases: ['google', 'googleassistant', 'assistant'],
      args: [{ name: 'stop', type: CommandArgumentTypes.BOOL, default: false }],
    });
  }

  public async run(ctx: Context, { stop }: ParsedArgs) {
    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) {
      return await ctx.reply('Not in the voice channel.');
    }
    if (res.channel !== ctx.member.voiceChannel) {
      return await ctx.reply(
        'You are not in the voice channel this bot is currently in.'
      );
    }
    if (!res.initialized) return await ctx.reply('Voice not yet initialized!');

    if (!res.module) {
      new GoogleAssistantVoiceModule(res);
      return await ctx.reply('Google Assistant module initialized!');
    } else {
      if (res.module.constructor.name !== 'GoogleAssistantVoiceModule')
        return await ctx.reply('Another module active! Disable it first.');
      if (stop) {
        const result = res.module.destroy();
        if (!result) {
          return await ctx.reply(
            "Can't destroy yet, please wait until user input is done."
          );
        }
        return await ctx.reply('Google Assistant deactivated.');
      }

      (res.module as GoogleAssistantVoiceModule).startListening();
    }
  }
}
