import { ParsedArgs } from 'detritus-client/lib/command'
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants'

import { BaseInteractionCommand, InteractionContextExtended } from '../../BaseCommand'

export default class FeedbackCommand extends BaseInteractionCommand {
  public name = 'feedback'
  public description = 'Send us what do you think of this application!'

  constructor () {
    super({
      options: [
        {
          name: 'feedback',
          description: 'Feedback message',
          type: ApplicationCommandOptionTypes.STRING,
          required: true
        },
        {
          name: 'anonymous',
          description: 'Do you wish to be anonymous?',
          type: ApplicationCommandOptionTypes.BOOLEAN,
          default: () => false
        }
      ]
    })
  }

  public async run (ctx: InteractionContextExtended, { feedback, anonymous }: ParsedArgs) {
    let webhook: IConfigFeedbackWebhook
    if (!(webhook = ctx.interactionCommandClient.application.config.feedbackWebhook))
      return ctx.editOrRespond('Submitting feedback is temporarily disabled!')

    feedback = feedback.replaceAll('@', '@\u200b')

    ctx.rest.executeWebhook(webhook.id, webhook.token, {
      content: feedback,
      username: anonymous ? 'Anonymous#0000' : (ctx.user.tag + ' (' + ctx.user.id + ')'),
      avatarUrl: anonymous ? null : ctx.user.avatarUrl,
    })
    ctx.editOrRespond('Your feedback has been sent to our server, thank you!')
  }
}
