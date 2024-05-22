import { Command, CommandClient } from 'detritus-client';

import { homepage } from '@/package.json';

import { BaseCommand } from '../base';

export default class SourceCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'source',
      aliases: ['src'],
    });
  }

  public async run(ctx: Command.Context) {
    ctx.reply(homepage);
  }
}
