import { exec } from 'child_process';
import { ParsedArgs } from 'detritus-client/lib/command';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';
import { InteractionEditOrRespond } from 'detritus-client/lib/structures';
import { Markup } from 'detritus-client/lib/utils';

import { BaseInteractionCommand, InteractionContextExtended } from '../../base';
import { EMBED_COLORS } from '../../../constants';

export default class ExecCommand extends BaseInteractionCommand {
  public name = 'exec';
  public description = 'Application owners only.';

  constructor() {
    super({
      options: [
        {
          name: 'cmd',
          description: '...',
          type: ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public onBeforeRun(ctx: InteractionContextExtended, _args: ParsedArgs) {
    if (!ctx.user.isClientOwner) {
      ctx.editOrRespond('No.');
      return false;
    }

    return true;
  }

  public async run(ctx: InteractionContextExtended, { cmd }: ParsedArgs) {
    exec(cmd, (err, stdout, stderr) => {
      let message: InteractionEditOrRespond = {};

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
            description: Markup.codeblock(str),
            color: EMBED_COLORS.ERR,
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
            description: Markup.codeblock(str),
            color: EMBED_COLORS.DEF,
          };
      }

      ctx.editOrRespond(message);
    });
  }
}
