import { exec } from 'child_process';
import {
  Constants as DetritusConstants,
  Interaction,
  Structures,
  Utils,
} from 'detritus-client';

import { Constants } from '@clu/utils';

import { BaseSlashCommand } from '../../base';

export default class ExecCommand extends BaseSlashCommand {
  public name = 'exec';
  public description = 'application owners only';
  public ownerOnly = true;

  constructor() {
    super({
      options: [
        {
          name: 'cmd',
          description: '...',
          type: DetritusConstants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: Interaction.InteractionContext,
    { cmd }: Interaction.ParsedArgs
  ) {
    let message: Structures.InteractionEditOrRespond = {
      flags: DetritusConstants.MessageFlags.EPHEMERAL,
    };

    exec(cmd, (err, stdout, stderr) => {
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

      ctx.editOrRespond(message);
    });
  }
}
