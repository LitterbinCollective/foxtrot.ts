import { Utils } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class BitrateGetCommand extends BaseVoiceCommandOption {
  public name = 'get';
  public description = 'Get Opus encoder bitrate (in bps).';

  public async run(ctx: VoiceInteractionContext,) {
    if (!ctx.guild) return;

    ctx.editOrRespond(
      'The current Opus encoder bitrate is ' +
        Utils.Markup.codestring(ctx.voice.bitrate.toString()) + '.'
    );
  }
}
