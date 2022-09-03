import axios from 'axios';
import { ParsedArgs } from 'detritus-client/lib/command';
import {
  ApplicationCommandOptionTypes,
  MessageFlags,
} from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { inspect } from 'util';

import { BaseSlashCommand, InteractionContextExtended } from '../../base';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export default class EvalCommand extends BaseSlashCommand {
  public name = 'eval';
  public description = 'Application owners only.';

  constructor() {
    super({
      options: [
        {
          name: 'code',
          description: '...',
          type: ApplicationCommandOptionTypes.STRING,
          default: () => '',
        },
        {
          name: 'async',
          description: '...',
          type: ApplicationCommandOptionTypes.BOOLEAN,
          default: () => false,
        },
        {
          name: 'url',
          description: '...',
          type: ApplicationCommandOptionTypes.STRING,
          default: () => '',
        },
      ],
    });
  }

  public onBeforeRun(ctx: InteractionContextExtended, _args: ParsedArgs) {
    if (!ctx.user.isClientOwner) {
      ctx.editOrRespond('nah');
      return false;
    }

    return true;
  }

  public async run(
    ctx: InteractionContextExtended,
    { code, async, url }: ParsedArgs
  ) {
    if (url) code = (await axios(url)).data;

    let message = '';
    let language = 'js';
    try {
      if (async) {
        const funct = new AsyncFunction('context', code);
        message = await funct(ctx);
      } else message = await Promise.resolve(eval(code));

      if (typeof message === 'object')
        (message = inspect(message)), (language = 'js');
    } catch (err) {
      if (err instanceof Error) message = err.toString();
    }

    ctx.editOrRespond({
      content: Markup.codeblock(String(message), { language }),
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
