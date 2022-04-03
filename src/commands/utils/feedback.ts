import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class FeedbackCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
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
          aliases: ['anon', 'a']
        }
      ]
    })
  }

  public async run (ctx: Context, { feedback, anonymous }: ParsedArgs) {
    let webhook: IConfigFeedbackWebhook
    if (!(webhook = this.commandClient.application.config.feedbackWebhook))
      return ctx.reply('Submitting feedback is temporarily disabled!')

    feedback = feedback.replaceAll('@', '@\u200b')
    ctx.message.attachments.forEach(v => feedback += ' ' + v.url);

    this.commandClient.rest.executeWebhook(webhook.id, webhook.token, {
      content: feedback,
      username: anonymous ? 'Anonymous#0000' : (ctx.user.tag + ' (' + ctx.user.id + ')'),
      avatarUrl: anonymous ? null : ctx.user.avatarUrl,
    })
    ctx.reply('Your feedback has been sent to our server, thank you!')
  }
}
