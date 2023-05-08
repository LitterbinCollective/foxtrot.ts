import {
  CommandClient,
  Constants as DetritusConstants,
  Utils,
} from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

const choices = Object.keys(Constants.CorruptModeMappings)
  .map(x => (isNaN(+x) ? x : null))
  .filter(x => x !== null) as string[];

export default class CorruptModeCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'corrupt mode',
      aliases: ['corrupt m'],
      type: DetritusConstants.CommandArgumentTypes.STRING,
      required: false,
      label: 'mode',
    });
  }

  public async run(ctx: VoiceContext, { mode }: { mode?: string }) {
    if (!ctx.guild) return;
    if (mode) {
      if (!choices.includes(mode))
        return ctx.reply(
          await this.t(ctx, 'commands.corrupt.invalid-mode', choices.join(', '))
        );
      ctx.voice.pipeline.corruptMode = mode;
    }

    return ctx.reply(
      await this.t(ctx, 'commands.corrupt.current-mode', ctx.voice.pipeline.corruptMode)
    );
  }
}
