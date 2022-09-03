import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { BaseCommandOption, InteractionContextExtended } from '../../../base';
import { VoiceStore } from '../../../../stores';

export class EffectGetCommand extends BaseCommandOption {
  public name = 'get';
  public description = 'Get value of the specified effect option.';

  constructor() {
    super({
      options: [
        {
          name: 'effect',
          description: '# of the effect',
          type: ApplicationCommandOptionTypes.INTEGER,
          required: true
        },
        {
          name: 'key',
          description: 'Option key',
          type: ApplicationCommandOptionTypes.STRING,
          required: true
        }
      ]
    })
  }

  public run(ctx: InteractionContextExtended, { effect, key }: { effect: number; key: string }) {
    if (!ctx.guild) return;
    const voice = VoiceStore.get(ctx.guild.id);
    if (!voice) return;

    const value = voice.effects.getValue(effect, key);
    ctx.editOrRespond(value.toString());
  }
}