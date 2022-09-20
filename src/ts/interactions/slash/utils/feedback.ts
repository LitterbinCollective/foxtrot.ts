import { ParsedArgs } from 'detritus-client/lib/command';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand, InteractionContextExtended } from '../../base';
import config from '../../../../../config.json';

export default class FeedbackCommand extends BaseSlashCommand {
  public name = 'feedback';
  public description = 'Send us what do you think of this application!';

  constructor() {
    super({
      options: [
        {
          name: 'feedback',
          description: 'Feedback message',
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: 'anonymous',
          description: 'Do you wish to be anonymous?',
          type: ApplicationCommandOptionTypes.BOOLEAN,
          default: () => false,
        },
      ],
    });
  }

  public async run(
    ctx: InteractionContextExtended,
    { feedback, anonymous }: ParsedArgs
  ) {
    let webhook: IConfigFeedbackWebhook;
    if (
      !(webhook =
        config.feedbackWebhook)
    )
      return ctx.editOrRespond('Submitting feedback is temporarily disabled!');

    feedback = feedback.replaceAll('@', '@\u200b');

    ctx.rest.executeWebhook(webhook.id, webhook.token, {
      content: feedback,
      username: anonymous
        ? 'Anonymous'
        : ctx.user.username + ' [' + ctx.user.discriminator + '] (' + ctx.user.id + ')',
      avatarUrl: anonymous ? undefined : ctx.user.avatarUrl,
    });
    ctx.editOrRespond('Your feedback has been sent to our server, thank you!');
  }
}
