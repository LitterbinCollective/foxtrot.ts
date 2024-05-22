import { Command, CommandClient, Constants } from 'detritus-client';

import config from '@/configs/app.json';

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
    let text = 'commands.feedback.success';

    const webhook: IConfigFeedbackWebhook = config.feedbackWebhook;
    if (!webhook || webhook.id.length === 0 || webhook.token.length === 0)
      text = 'commands.feedback.fail'
    else
      ctx.rest.executeWebhook(webhook.id, webhook.token, {
        content: feedback,
        username:
          anonymous
            ? 'Anonymous'
            : `${ctx.user.tag} (${ctx.user.id})`,
        avatarUrl: anonymous ? undefined : ctx.user.avatarUrl,
        allowedMentions: {
          parse: ['users'],
        },
      });

    ctx.reply(await this.t(ctx, text));
  }
}
