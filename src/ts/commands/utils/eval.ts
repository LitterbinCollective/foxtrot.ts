import axios from 'axios';
import { Context, ParsedArgs } from 'detritus-client/lib/command';
import {
  CommandArgumentTypes,
  DiscordRegexNames,
} from 'detritus-client/lib/constants';
import { Markup, regex } from 'detritus-client/lib/utils';
import { inspect } from 'util';

import { BaseCommand } from '../base';
import { CatvoxCommandClient } from '../../application';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export default class EvalCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'eval',
      type: (value) => {
        const { matches } = regex(DiscordRegexNames.TEXT_CODEBLOCK, value);
        if (matches.length > 0) return matches[0].text;
        return value;
      },
      label: 'code',
      args: [
        { name: 'async', type: CommandArgumentTypes.BOOL },
        { name: 'url', type: CommandArgumentTypes.STRING },
      ],
    });
  }

  public onBeforeRun(ctx: Context, _: ParsedArgs) {
    return ctx.user.isClientOwner;
  }

  public async run(ctx: Context, { code, async, url }: ParsedArgs) {
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

    ctx.user.createMessage(Markup.codeblock(String(message), { language }));
  }
}
