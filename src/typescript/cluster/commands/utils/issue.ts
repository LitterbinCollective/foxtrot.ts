import { Command, CommandClient } from 'detritus-client';

import config from '@/managers/config';

import { BaseCommand } from '../base';

const { bugs } = config.packageJson;

export default class IssueCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'issue',
      aliases: ['bug'],
    });
  }

  public async run(ctx: Command.Context) {
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url) return ctx.reply(await this.t(ctx, 'commands.no-issue-url'));
    ctx.reply(url.toString());
  }
}
