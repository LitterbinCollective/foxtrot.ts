import axios from 'axios';
import { Command, CommandClient, Constants, Utils } from 'detritus-client';
import { inspect } from 'util';

import { BaseCommand } from '../base';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export default class EvalCommand extends BaseCommand {
  public ownerOnly = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'eval',
      type: value => {
        const { matches } = Utils.regex(Constants.DiscordRegexNames.TEXT_CODEBLOCK, value);
        if (matches.length > 0) return matches[0].text;
        return value;
      },
      label: 'code',
      args: [
        { name: 'async', type: Constants.CommandArgumentTypes.BOOL },
        { name: 'url', type: Constants.CommandArgumentTypes.STRING },
      ],
    });
  }

  public async run(ctx: Command.Context, { code, async, url }: { code: string, async: boolean, url: string }) {
    if (url && url.length !== 0) code = (await axios(url)).data;

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

    ctx.user.createMessage(Utils.Markup.codeblock(String(message), { language }));
  }
}
