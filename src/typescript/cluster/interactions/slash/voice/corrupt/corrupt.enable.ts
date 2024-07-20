import { Constants as DetritusConstants } from 'detritus-client';

import { Constants } from '@cluster/utils';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class CorruptEnableCommand extends BaseVoiceCommandOption {
  public name = 'enable';
  public description = 'enable audio corruption';

  constructor() {
    super({
      options: [
        {
          name: 'enable',
          description: 'enable?',
          type: DetritusConstants.ApplicationCommandOptionTypes.BOOLEAN,
          required: true,
        },
      ],
    });
  }

  public async run(
    ctx: VoiceInteractionContext,
    { enable }: { enable: boolean }
  ) {
    if (!ctx.guild) return;
    ctx.voice.pipeline.corrupt = enable;

    if (enable) ctx.voice.pipeline.volume = Constants.CORRUPT_VOLUME_ON_ENABLE;

    let postfix = enable ? 'enabled' : 'disabled';
    ctx.editOrRespond(
      await this.t(
        ctx,
        'commands.corrupt.' + postfix,
        Constants.CORRUPT_VOLUME_ON_ENABLE
      )
    );
  }
}
