import { CommandClient } from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class CorruptEnableCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'corrupt',
      priority: -1,
    });
  }

  public async run(ctx: VoiceContext) {
    if (!ctx.guild) return;
    let enable = false;

    ctx.voice.pipeline.corrupt = enable = !ctx.voice.pipeline.corrupt;
    if (enable) ctx.voice.pipeline.volume = Constants.CORRUPT_VOLUME_ON_ENABLE;

    let postfix = enable ? 'enabled' : 'disabled';
    ctx.reply(
      await this.t(
        ctx,
        'commands.corrupt.' + postfix,
        Constants.CORRUPT_VOLUME_ON_ENABLE
      )
    );
  }
}
