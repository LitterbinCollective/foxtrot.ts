import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';
import GoogleAssistantVoiceModule from '../../voice/googleAssistant';

export default class GACommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'ga',
      aliases: ['google', 'googleassistant', 'assistant'],
      args: [
        { name: 'stop', type: CommandArgumentTypes.BOOL, default: false },
      ],
    });
  }

  public async run(ctx: Context, { stop }: ParsedArgs) {
    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res)
      return ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel)
      return ctx.reply('You are not in the voice channel this bot is currently in.');

    if (!res.googleAssistant) {
      new GoogleAssistantVoiceModule(res);
      return ctx.reply('Google Assistant module initialized!')
    } else {
      if (stop) {
        const result = res.googleAssistant.destroy();
        if (!result)
          return ctx.reply("Can't destroy yet, please wait until user input is done.");
        return ctx.reply('Google Assistant deactivated.');
      }

      res.googleAssistant.startListening();
    }
  }
}
