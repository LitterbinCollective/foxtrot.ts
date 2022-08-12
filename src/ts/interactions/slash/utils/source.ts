import { BaseInteractionCommand, InteractionContextExtended } from '../../base';

export default class SourceCommand extends BaseInteractionCommand {
  public name = 'source';
  public description = 'Source code for glowmem.';

  public async run(ctx: InteractionContextExtended) {
    const { homepage } = ctx.interactionCommandClient.application.packageJson;
    ctx.editOrRespond(homepage);
  }
}
