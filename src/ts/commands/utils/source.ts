import { Context } from 'detritus-client/lib/command';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import { homepage } from '../../../../package.json';

export default class SourceCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'source',
      aliases: ['src'],
    });
  }

  public async run(ctx: Context) {
    ctx.reply(homepage);
  }
}
