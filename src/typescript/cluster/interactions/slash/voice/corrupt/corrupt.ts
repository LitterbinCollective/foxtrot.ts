import { BaseVoiceSlashCommand } from '../base';
import { CorruptEnableCommand } from './corrupt.enable';
import { CorruptEveryCommand } from './corrupt.every';
import { CorruptModeCommand } from './corrupt.mode';
import { CorruptRandSampleCommand } from './corrupt.rand-sample';

export default class CorruptCommand extends BaseVoiceSlashCommand {
  public name = 'corrupt';
  public description = '.';

  constructor() {
    super({
      options: [
        new CorruptEnableCommand(),
        new CorruptEveryCommand(),
        new CorruptModeCommand(),
        new CorruptRandSampleCommand(),
      ],
    });
  }
}
