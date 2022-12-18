import { CommandClient, Utils } from 'detritus-client';

import { VoiceStore } from '@/modules/stores';
import { Constants } from '@/modules/utils';

import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e',
      aliases: ['effect'],
      priority: -1,
    });
  }

  public run(ctx: VoiceContext) {
    const embed = new Utils.Embed({
      title: 'Available effects',
      description: Utils.Markup.codeblock(
        Object.keys(ctx.voice.effects.processors).join('\n')
      ),
      color: Constants.EMBED_COLORS.DEFAULT,
    });
    ctx.reply({ embed });
  }
}
