import { runJS } from '@/modules/utils/eval-helper';
import axios from 'axios';
import { Constants, Interaction, Utils } from 'detritus-client';
import { inspect } from 'util';

import { BaseSlashCommand } from '../../base';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export default class EvalCommand extends BaseSlashCommand {
  public name = 'eval';
  public description = 'Application owners only.';
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
    if (url && url.length !== 0) code = (await axios(url)).data;

    let message = await runJS(ctx, code, async);

    await ctx.editOrRespond({
      content: Utils.Markup.codeblock(String(message), { language: 'js' }),
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
