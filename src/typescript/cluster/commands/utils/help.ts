import { Command, CommandClient } from 'detritus-client';

import config from '@/managers/config';

import { BaseCommand } from '../base';

export default class HelpCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'help',
      aliases: ['?'],
    });
  }

  public async run(ctx: Command.Context) {
    if (config.packageJson.homepage)
      ctx.reply(config.packageJson.homepage + '/commands/utils/\n');
  }
}
