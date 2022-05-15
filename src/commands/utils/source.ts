import { Context } from 'detritus-client/lib/command';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';

export default class SourceCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'source',
      aliases: ['src'],
    });
  }

  public async run(ctx: Context) {
    const { homepage } = this.commandClient.application.pkg;
    ctx.reply(homepage);
  }
}
