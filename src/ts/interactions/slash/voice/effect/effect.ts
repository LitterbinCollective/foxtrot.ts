import { BaseVoiceCommand } from '../base';
import { EffectAddCommand } from './effect.add';
import { EffectClearCommand } from './effect.clear';
import { EffectGetCommand } from './effect.get';
import { EffectListCommand } from './effect.list';
import { EffectOptionsCommand } from './effect.options';
import { EffectRemoveCommand } from './effect.remove';
import { EffectSetCommand } from './effect.set';

export default class EffectCommand extends BaseVoiceCommand {
  public name = 'effect';
  public description = '.';

  constructor() {
    super({
      options: [
        new EffectAddCommand(),
        new EffectClearCommand(),
        new EffectGetCommand(),
        new EffectListCommand(),
        new EffectOptionsCommand(),
        new EffectRemoveCommand(),
        new EffectSetCommand(),
      ],
    });
  }
}