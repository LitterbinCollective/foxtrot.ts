import { Command, CommandClient, Constants } from 'detritus-client';

import { sendFeedback } from '@cluster/utils';

import { BaseCommand } from '../base';

export default class FeedbackCommand extends BaseCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'feedback',
      aliases: ['fb'],
      consume: true,
      type: Constants.CommandArgumentTypes.STRING,
      required: true,
      args: [
        {
          name: 'anonymous',
          type: Constants.CommandArgumentTypes.BOOL,
          aliases: ['anon', 'a'],
        },
      ],
    });
  }

  public async run(
    ctx: Command.Context,
    { feedback, anonymous }: { feedback: string; anonymous: boolean }
  ) {
    if (!ctx.guild) return;
    let text = 'commands.feedback.fail';

    if (sendFeedback(ctx.rest, feedback, anonymous ? undefined : ctx.user))
      text = 'commands.feedback.success';

    ctx.reply(await this.t(ctx, text));
  }
}
