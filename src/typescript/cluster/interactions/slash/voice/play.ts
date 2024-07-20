// supposed to act as an alias to "queue add"
import { BaseSlashCommand } from '../../base';
import {
  QueueAddCommand,
  QUEUE_ADD_DESCRIPTION,
  QUEUE_ADD_OPTIONS,
} from './queue/queue.add';

export default class PlayCommand extends BaseSlashCommand {
  public name = 'play';
  public description = QUEUE_ADD_DESCRIPTION;

  constructor() {
    super({
      options: QUEUE_ADD_OPTIONS,
    });

    this.run = QueueAddCommand.prototype.run.bind(this);
  }
}
