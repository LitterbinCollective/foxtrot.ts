import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class IssueCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'issue',
      aliases: ['bug']
    })
  }

  public async run (ctx: Context) {
    const { bugs } = this.commandClient.application.pkg
    const url = (typeof bugs === 'object' && bugs.url) ? bugs.url : bugs
    ctx.reply(url.toString())
  }
}
