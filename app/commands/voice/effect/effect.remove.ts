import { CommandClient, Constants as DetritusConstants, Utils } from 'detritus-client';

import { Constants, listEffects } from '@/modules/utils';
import { BaseVoiceCommand, VoiceContext } from '../base';

export default class EffectRemoveCommand extends BaseVoiceCommand {
  constructor(commandClient: CommandClient) {
    super(commandClient, {
      name: 'e remove',
      aliases: ['effect remove', 'e rm', 'effect rm'],
      type: [
        { name: 'effect', type: DetritusConstants.CommandArgumentTypes.NUMBER, required: true },
      ],
    });
  }

  public run(ctx: VoiceContext, { effect }: { effect: number }) {
    ctx.voice.effects.removeEffect(effect);
    const embed = listEffects(ctx.voice.effects.list, ctx.voice.effects.STACK_LIMIT);
    embed.setTitle(
      Constants.EMOJIS.MINUS + ' Removed effect ' + Utils.Markup.codestring(effect.toString())
    );
    ctx.reply({ embed });
  }
}
