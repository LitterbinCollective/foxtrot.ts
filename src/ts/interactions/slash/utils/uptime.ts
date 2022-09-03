import prettyMilliseconds from 'pretty-ms';

import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import { EMBED_COLORS, EMOJIS } from '../../../constants';

export default class UptimeCommand extends BaseSlashCommand {
  public name = 'uptime';
  public description = 'glowmem up-time';

  public async run(ctx: InteractionContextExtended) {
    const { startAt } = ctx.interactionCommandClient.application;

    const prefix = Math.random() >= 0.75 ? ' Suffering for ' : ' Running for ';
    ctx.editOrRespond({
      embed: {
        title:
          EMOJIS.STOPWATCH + prefix + prettyMilliseconds(Date.now() - startAt),
        color: EMBED_COLORS.DEF,
      },
    });
  }
}
