import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from '../base';
import { bugs } from '@/package.json';

export default class IssueCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'issue',
      aliases: ['bug'],
    });
  }

  public async run(ctx: Command.Context) {
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url)
      return ctx.reply('Submit issues directly to the hoster.');
    ctx.reply(url.toString());
  }
}
