import { Constants, Utils } from 'detritus-client';

import { BaseVoiceCommandOption, VoiceInteractionContext } from '../base';

export class EffectGetCommand extends BaseVoiceCommandOption {
  public name = 'get';
  public description = 'get value of the specified effect option';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: Constants.ApplicationCommandOptionTypes.INTEGER,
          required: true,
        },
        {
          name: 'key',
          description: 'option key',
          type: Constants.ApplicationCommandOptionTypes.STRING,
          required: true,
        },
      ],
    });
  }

  public run(
    ctx: VoiceInteractionContext,
    { effect, key }: { effect: number; key: string }
  ) {
    const value = ctx.voice.effects.getValue(effect, key);
    ctx.editOrRespond(Utils.Markup.codestring(value.toString()));
  }
}
