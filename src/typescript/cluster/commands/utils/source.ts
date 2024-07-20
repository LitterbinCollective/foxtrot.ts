import { Command, CommandClient } from 'detritus-client';

import config from '@/managers/config';

import { BaseCommand } from '../base';

export default class WebsiteCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'website',
      aliases: ['ws'],
    });
  }

  public async run(ctx: Command.Context) {
    if (config.packageJson.homepage)
      ctx.reply(config.packageJson.homepage);
  }
}
