import { Interaction } from 'detritus-client';

import { BaseSlashCommand } from '../../base';
import { bugs } from '@/package.json';

export default class IssueCommand extends BaseSlashCommand {
  public name = 'issue';
  public description = 'Report bugs and technical issues.';

  public async run(ctx: Interaction.InteractionContext) {
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url) return; // what the fuck?
    ctx.editOrRespond(url.toString());
  }
}
