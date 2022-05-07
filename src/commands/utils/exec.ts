import { exec } from 'child_process'
import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants'
import { RequestTypes } from 'detritus-client-rest'

import { CommandClientExtended } from '../../Application'
import { BaseCommand } from '../../BaseCommand'
import { EMBED_COLORS } from '../../constants';

export default class IssueCommand extends BaseCommand {
  constructor (commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'exec',
      aliases: ['cexec'],
      consume: true,
      type: CommandArgumentTypes.STRING
    })
  }

  public onBeforeRun(ctx: Context, _: ParsedArgs) {
    return ctx.user.isClientOwner;
  }

  public async run (ctx: Context, args: ParsedArgs) {
    exec(args.exec, (err, stdout, stderr) => {
      let message: RequestTypes.CreateMessage = {}

      if (err) {
        const str = stderr.toString()
        if (str.length >= 4090) {
          message.content = 'Error occurred while running'
          message.file = {
            filename: Date.now() + '.txt',
            value: str
          }
        } else
          message.embed = {
            title: 'Error occurred while running',
            description: '```' + str + '```',
            color: EMBED_COLORS.ERR
          }
      } else {
        const str = stdout.toString()
        if (str.length >= 4090) {
          message.content = 'Result'
          message.file = {
            filename: Date.now() + '.txt',
            value: str
          }
        } else
          message.embed = {
            title: 'Result',
            description: '```' + str + '```',
            color: EMBED_COLORS.DEF
          }
      }

      ctx.reply(message)
    })
  }
}
