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
    { code, async, url }: { code: string; async: string; url: string }
  ) {
    if (url && url.length !== 0) code = (await axios(url)).data;

    let message = '';
    let language = 'js';
    try {
      if (async) {
        const funct = new AsyncFunction('context', code);
        message = await funct(ctx);
      } else message = await Promise.resolve(eval(code));

      if (typeof message === 'object') message = inspect(message);
    } catch (err) {
      if (err instanceof Error) message = err.toString();
    }

    ctx.editOrRespond({
      content: Utils.Markup.codeblock(String(message), { language }),
      flags: Constants.MessageFlags.EPHEMERAL,
    });
  }
}
