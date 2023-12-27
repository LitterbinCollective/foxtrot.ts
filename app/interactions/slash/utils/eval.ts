import { Constants, Interaction, Utils } from 'detritus-client';

import { runJS } from '@/modules/utils/eval-helper';

import { BaseSlashCommand } from '../../base';

export default class EvalCommand extends BaseSlashCommand {
  public name = 'eval';
  public description = 'application owners only';
  public ownerOnly = true;

  constructor() {
    super({
      options: [
        {
          name: 'code',
          description: '...',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          default: () => '',
        },
        {
          name: 'async',
          description: '...',
          type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
          default: () => false,
        },
        {
          name: 'url',
          description: '...',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          default: () => '',
        },
      ],
    });
  }

  public async run(
    ctx: Interaction.InteractionContext,
    { code, async, url }: { code: string; async: boolean; url: string }
  ) {
    if (url && url.length !== 0) {
      const response = await fetch(url);
      code = await response.text();
    }

    let message = await runJS(ctx, code, async);

    await ctx.editOrRespond({
      content: Utils.Markup.codeblock(String(message), { language: 'js' }),
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
