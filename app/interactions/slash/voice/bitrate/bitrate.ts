import { BaseVoiceSlashCommand } from '../base';
import { BitrateGetCommand } from './bitrate.get';
import { BitrateSetCommand } from './bitrate.set';

export default class BitrateCommand extends BaseVoiceSlashCommand {
  public name = 'bitrate';
  public description = '.';

  constructor() {
    super({
      options: [new BitrateGetCommand(), new BitrateSetCommand()],
    });
  }
}
