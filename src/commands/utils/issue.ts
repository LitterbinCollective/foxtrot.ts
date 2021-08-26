import { Context } from 'detritus-client/lib/command';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';
import pkg from '../../../package.json';

export default class IssueCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'issue',
      aliases: [ 'bug' ]
    });
  }

  public async run(ctx: Context) {
    ctx.reply(pkg.bugs.url);
  }
}