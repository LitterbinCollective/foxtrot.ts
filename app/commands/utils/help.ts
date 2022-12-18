import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from '../base';
import { homepage } from '@/package.json';

export default class HelpCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'help',
      aliases: ['?'],
    });
  }

  public async run(ctx: Command.Context) {
    ctx.reply(homepage + '/wiki');
  }
}
