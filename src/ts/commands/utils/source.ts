import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../base';

export default class SourceCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'source',
      aliases: ['src'],
    });
  }

  public async run(ctx: Context) {
    const { homepage } = this.commandClient.application.packageJson;
    ctx.reply(homepage);
  }
}
