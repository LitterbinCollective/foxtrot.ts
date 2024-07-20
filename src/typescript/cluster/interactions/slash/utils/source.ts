import { Interaction } from 'detritus-client';

import config from '@/managers/config';
import { Constants } from '@cluster/utils';

import { BaseSlashCommand } from '../../base';

export default class WebsiteCommand extends BaseSlashCommand {
  public name = 'website';
  public description = 'website for ' + Constants.APPLICATION_NAME;

  public async run(ctx: Interaction.InteractionContext) {
    if (config.packageJson.homepage)
      ctx.editOrRespond(config.packageJson.homepage);
    else
      ctx.editOrRespond('-');
  }
}
