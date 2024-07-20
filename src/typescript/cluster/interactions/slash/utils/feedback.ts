import { Constants, Interaction } from 'detritus-client';

import { sendFeedback } from '@cluster/utils';

import { BaseSlashCommand } from '../../base';

export default class FeedbackCommand extends BaseSlashCommand {
  public name = 'feedback';
  public description = 'send us what do you think of this application!';

  constructor() {
    super({
      options: [
        {
          name: 'feedback',
          description: 'Feedback message',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
        {
          name: 'anonymous',
          description: 'Do you wish to be anonymous?',
          type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
          default: () => false,
        },
      ],
    });
  }

  public async run(
    ctx: Interaction.InteractionContext,
    { feedback, anonymous }: Interaction.ParsedArgs
  ) {
    let text = 'commands.feedback.fail';

    if (sendFeedback(ctx.rest, feedback, anonymous ? undefined : ctx.user))
      text = 'commands.feedback.success';

    ctx.editOrRespond(await this.t(ctx, text));
  }
}
