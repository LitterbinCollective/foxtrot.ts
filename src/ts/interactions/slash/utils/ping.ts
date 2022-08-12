import { BaseInteractionCommand, InteractionContextExtended } from '../../base';

export default class PingCommand extends BaseInteractionCommand {
  public name = 'ping';
  public description = 'Ping-pong!';

  public async run(ctx: InteractionContextExtended) {
    const { gateway, rest } = await ctx.client.ping();
    const text: string[] = [
      'REST: ' + rest + 'ms',
      'Gateway: ' + gateway + 'ms',
    ];

    ctx.editOrRespond(
      'Pong! ' + text.join(' / ') + '. (shardId: ' + ctx.shardId + ')'
    );
  }
}
