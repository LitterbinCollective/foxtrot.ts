import { Command, CommandClient } from 'detritus-client';
import prettyMilliseconds from 'pretty-ms';

import app from '@/app';
import { Constants } from '@/modules/utils';

import { BaseCommand } from '../base';

export default class UptimeCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'uptime',
      aliases: ['ut'],
    });
  }

  public async run(ctx: Command.Context) {
    const prefix = Math.random() >= 0.75 ? ' Suffering for ' : ' Running for ';
    ctx.reply({
      embed: {
        title:
          Constants.EMOJIS.STOPWATCH +
          prefix +
          prettyMilliseconds(Date.now() - app.startAt),
        color: Constants.EMBED_COLORS.DEFAULT,
      },
    });
  }
}
