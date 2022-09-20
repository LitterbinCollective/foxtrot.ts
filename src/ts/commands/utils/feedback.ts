import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CatvoxCommandClient } from '../../application';
import { BaseCommand } from '../base';
import config from '../../../../config.json';

export default class FeedbackCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'feedback',
      aliases: ['fb'],
      consume: true,
      type: CommandArgumentTypes.STRING,
      required: true,
      args: [
        {
          name: 'anonymous',
          type: CommandArgumentTypes.BOOL,
          aliases: ['anon', 'a'],
        },
      ],
    });
  }

  public async run(ctx: Context, { feedback, anonymous }: ParsedArgs) {
    let webhook: IConfigFeedbackWebhook;
    if (!(webhook = config.feedbackWebhook))
      return ctx.reply('Submitting feedback is temporarily disabled!');

    feedback = feedback.replaceAll('@', '@\u200b');
    ctx.message.attachments.forEach((v) => (feedback += ' ' + v.url));

    ctx.rest.executeWebhook(webhook.id, webhook.token, {
      content: feedback,
      username: anonymous
        ? 'Anonymous'
        : ctx.user.username + ' [' + ctx.user.discriminator + '] (' + ctx.user.id + ')',
      avatarUrl: anonymous ? undefined : ctx.user.avatarUrl,
    });
    ctx.reply('Your feedback has been sent to our server, thank you!');
  }
}
