import { BaseInteractionCommand, InteractionContextExtended } from '../../base';

export default class IssueCommand extends BaseInteractionCommand {
  public name = 'issue';
  public description = 'Report bugs and technical issues.';

  public async run(ctx: InteractionContextExtended) {
    const { bugs } = ctx.interactionCommandClient.application.packageJson;
    const url = typeof bugs === 'object' && bugs.url ? bugs.url : bugs;
    if (!url) return; // what the fuck?
    ctx.editOrRespond(url.toString());
  }
}
