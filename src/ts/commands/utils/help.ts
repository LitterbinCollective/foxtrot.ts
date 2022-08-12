import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../base';

export default class HelpCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'help',
      aliases: ['?'],
    });
  }

  public async run(ctx: Context) {
    const { homepage } = this.commandClient.application.packageJson;
    ctx.reply(homepage + '/wiki');
  }
}
