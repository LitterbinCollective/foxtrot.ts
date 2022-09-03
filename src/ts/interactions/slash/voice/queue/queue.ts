import { BaseVoiceCommand } from '../base';
import { QueueAddCommand } from './queue.add';
import { QueueListCommand } from './queue.list';
import { QueueRemoveCommand } from './queue.remove';

export default class QueueCommand extends BaseVoiceCommand {
  public name = 'queue';
  public description = '.';

  constructor() {
    super({
      options: [
        new QueueAddCommand(),
        new QueueListCommand(),
        new QueueRemoveCommand()
      ],
    });
  }
}