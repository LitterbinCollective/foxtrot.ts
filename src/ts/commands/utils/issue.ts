import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import { bugs } from '../../../../package.json';

export default class IssueCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'issue',
      aliases: ['bug'],
    });
  }

  public async run(ctx: Context) {
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url) return;
    ctx.reply(url.toString());
  }
}
