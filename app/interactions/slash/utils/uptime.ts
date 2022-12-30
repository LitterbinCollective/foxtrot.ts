import { Interaction } from 'detritus-client';
import prettyMilliseconds from 'pretty-ms';

import app from '@/app';
import { Constants } from '@/modules/utils';

import { BaseSlashCommand } from '../../base';

export default class UptimeCommand extends BaseSlashCommand {
  public name = 'uptime';
  public description = Constants.APPLICATION_NAME + ' up-time';

  public async run(ctx: Interaction.InteractionContext) {
    const prefix = Math.random() >= 0.75 ? ' Suffering for ' : ' Running for ';
    ctx.editOrRespond({
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
