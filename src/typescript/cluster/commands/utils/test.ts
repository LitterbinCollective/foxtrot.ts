import { Command, CommandClient } from 'detritus-client';

import { BaseCommand } from '../base';

export default class ErrorTestCommand extends BaseCommand {
  public ownerOnly: boolean = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'ierrorintentionally(fortestingpurposes)dontyoufuckingdarerunmeinproduction',
    });
  }

  public async run(ctx: Command.Context) {
    if (process.env.NODE_ENV === 'production')
      return ctx.reply('No.\n\nSent from my iPhone.');

    throw new Error('hi');
  }
}
