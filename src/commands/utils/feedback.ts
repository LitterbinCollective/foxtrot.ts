import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'

import { CommandClientExtended } from '../../Application'
import BaseCommand from '../../BaseCommand'

export default class FeedbackCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'feedback',
      aliases: ['fb'],
      consume: true,
      type: CommandArgumentTypes.STRING
    })
  }

  public async run (ctx: Context, { feedback }: ParsedArgs) {
    let webhook: IConfigFeedbackWebhook
    if (!(webhook = this.commandClient.application.config.feedbackWebhook))
      return ctx.reply('Submitting feedback is temporarily disabled!')

    feedback = feedback.replaceAll('@', '@\u200b')

    this.commandClient.rest.executeWebhook(webhook.id, webhook.token, {
      content: feedback,
      username: ctx.user.tag + ' (' + ctx.user.id + ')',
      avatarUrl: ctx.user.avatarUrl
    })
    ctx.reply('Your feedback has been sent to our server, thank you!')
  }
}
