import { Context } from 'detritus-client/lib/command'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'

export default class HelpCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'help',
      aliases: [ '?' ]
    })
  }

  public async run (ctx: Context) {
    const { homepage } = this.commandClient.application.pkg
    ctx.reply(homepage + '/wiki')
  }
}
