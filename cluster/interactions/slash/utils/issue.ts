import { Interaction } from 'detritus-client';

import { BaseSlashCommand } from '../../base';
import { bugs } from '@/package.json';

export default class IssueCommand extends BaseSlashCommand {
  public name = 'issue';
  public description = 'report bugs and technical issues';

  public async run(ctx: Interaction.InteractionContext) {
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url)
      return ctx.editOrRespond(await this.t(ctx, 'commands.no-issue-url'));
    ctx.editOrRespond(url.toString());
  }
}
