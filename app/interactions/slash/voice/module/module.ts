import { BaseVoiceSlashCommand } from '../base';
import { ModuleAssignCommand } from './module.assign';
import { ModuleDestroyCommand } from './module.destroy';
import { ModuleInvokeCommand } from './module.invoke';

export default class ModuleCommand extends BaseVoiceSlashCommand {
  public name = 'module';
  public description = '.';

  constructor() {
    super({
      options: [
        new ModuleAssignCommand(),
        new ModuleDestroyCommand(),
        new ModuleInvokeCommand(),
      ],
    });
  }
}