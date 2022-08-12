import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../base';

export default class IssueCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'issue',
      aliases: ['bug'],
    });
  }

  public async run(ctx: Context) {
    const { bugs } = this.commandClient.application.packageJson;
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url) return; // what the fuck?
    ctx.reply(url.toString());
  }
}
