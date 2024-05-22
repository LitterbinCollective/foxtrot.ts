import { Command, CommandClient, Constants, Utils } from 'detritus-client';

import runJS from '@clu/utils/eval';

import { BaseCommand } from '../base';

export default class EvalCommand extends BaseCommand {
  public ownerOnly = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'eval',
      type: value => {
        const { matches } = Utils.regex(
          Constants.DiscordRegexNames.TEXT_CODEBLOCK,
          value
        );
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

  public async run(
    ctx: Command.Context,
    { code, async, url }: { code: string; async: boolean; url: string }
  ) {
    if (url && url.length !== 0) {
      const response = await fetch(url);
      code = await response.text();
    }

    let message = await runJS(ctx, code, async);

    await ctx.user.createMessage(
      Utils.Markup.codeblock(String(message), { language: 'js' })
    );
  }
}
