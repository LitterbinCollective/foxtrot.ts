import { Interaction } from 'detritus-client';

import { Constants } from '@/modules/utils';

import { BaseSlashCommand } from '../../base';
import { homepage } from '@/package.json';

export default class SourceCommand extends BaseSlashCommand {
  public name = 'source';
  public description = 'source code for ' + Constants.APPLICATION_NAME;

  public async run(ctx: Interaction.InteractionContext) {
    ctx.editOrRespond(homepage);
  }
}
