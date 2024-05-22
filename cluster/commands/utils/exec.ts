import { exec } from 'child_process';
import {
  Command,
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';
import { RequestTypes } from 'detritus-client-rest';

import { Constants } from '@clu/utils';

import { BaseCommand } from '../base';

export default class IssueCommand extends BaseCommand {
  public ownerOnly = true;

  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'exec',
      aliases: ['cexec'],
      consume: true,
      type: DetritusConstants.CommandArgumentTypes.STRING,
    });
  }

  public async run(ctx: Command.Context, args: { exec: string }) {
    exec(args.exec, (err, stdout, stderr) => {
      let message: RequestTypes.CreateMessage = {};

      if (err) {
        const str = stderr.toString();
        if (str.length >= 4090) {
          message.content = 'Error occurred while running';
          message.file = {
            filename: Date.now() + '.txt',
            value: str,
          };
        } else
          message.embed = {
            title: 'Error occurred while running',
            description: Utils.Markup.codeblock(str),
            color: Constants.EMBED_COLORS.ERROR,
          };
      } else {
        const str = stdout.toString();
        if (str.length >= 4090) {
          message.content = 'Result';
          message.file = {
            filename: Date.now() + '.txt',
            value: str,
          };
        } else
          message.embed = {
            title: 'Result',
            description: Utils.Markup.codeblock(str),
            color: Constants.EMBED_COLORS.DEFAULT,
          };
      }

      try {
        ctx.user.createMessage(message);
      } catch (err) {
        ctx.reply('Unable to send the result.');
      }
    });
  }
}
