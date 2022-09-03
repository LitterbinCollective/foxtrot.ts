import { Context } from 'detritus-client/lib/command';
import prettyMilliseconds from 'pretty-ms';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import { EMBED_COLORS, EMOJIS } from '../../constants';

export default class UptimeCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'uptime',
      aliases: ['ut'],
    });
  }

  public async run(ctx: Context) {
    const { startAt } = this.commandClient.application;

    const prefix = Math.random() >= 0.75 ? ' Suffering for ' : ' Running for ';
    ctx.reply({
      embed: {
        title:
          EMOJIS.STOPWATCH + prefix + prettyMilliseconds(Date.now() - startAt),
        color: EMBED_COLORS.DEF,
      },
    });
  }
}
