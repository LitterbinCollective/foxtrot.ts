import { Context } from 'detritus-client/lib/command';
import { Embed, Markup } from 'detritus-client/lib/utils';
import { CatvoxCommandClient } from '../../../application';

import { EMBED_COLORS } from '../../../constants';
import { BaseVoiceCommand } from '../base';
import { VoiceStore } from '../../../stores';

export default class EffectDefaultCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e',
      aliases: ['effect'],
      priority: -1,
    });
  }

  public run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const embed = new Embed({
      title: 'Available effects',
      description: Markup.codeblock(
        Object.keys(voice.effects.processors).join('\n')
      ),
      color: EMBED_COLORS.DEF,
    });
    ctx.reply({ embed });
  }
}
