import { Context } from 'detritus-client/lib/command';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';

export default class PingCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'ping',
    });
  }

  public async run(ctx: Context) {
    const start = Date.now();
    const message = await ctx.reply('...');

    message.edit(
      'Pong! Took ' + (Date.now() - start) + 'ms to edit a message.'
    );
  }
}
