import { BaseVoiceSlashCommand } from '../base';
import { QueueAddCommand } from './queue.add';
import { QueueClearCommand } from './queue.clear';
import { QueueListCommand } from './queue.list';
import { QueueRemoveCommand } from './queue.remove';

export default class QueueCommand extends BaseVoiceSlashCommand {
  public name = 'queue';
  public description = '.';

  constructor() {
    super({
      options: [
        new QueueAddCommand(),
        new QueueClearCommand(),
        new QueueListCommand(),
        new QueueRemoveCommand(),
      ],
    });
  }
}
