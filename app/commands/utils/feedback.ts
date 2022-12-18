import { Command, CommandClient, Constants } from 'detritus-client';

import { sendFeedback } from '@/modules/utils';

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

  public async run(ctx: Command.Context, { feedback, anonymous }: { feedback: string, anonymous: boolean }) {
    let text = 'Failed to submit feedback.';

    if (sendFeedback(ctx.rest, feedback, anonymous ? undefined : ctx.user))
      text = 'Your feedback has been sent to our server, thank you!';

    ctx.reply(text);
  }
}
