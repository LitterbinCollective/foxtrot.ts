import { BaseInteractionCommand, InteractionContextExtended } from '../../BaseCommand'

export default class SourceCommand extends BaseInteractionCommand {
  public name = 'source'
  public description = 'Source code for glowmem.'

  public async run (ctx: InteractionContextExtended) {
    const { homepage } = ctx.interactionCommandClient.application.pkg
    ctx.editOrRespond(homepage)
  }
}
