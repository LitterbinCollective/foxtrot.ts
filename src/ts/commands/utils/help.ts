import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import { homepage } from '../../../../package.json';

export default class HelpCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'help',
      aliases: ['?'],
    });
  }

  public async run(ctx: Context) {
    ctx.reply(homepage + '/wiki');
  }
}
