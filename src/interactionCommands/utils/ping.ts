import {
  BaseInteractionCommand,
  InteractionContextExtended,
} from '../../BaseCommand';

export default class PingCommand extends BaseInteractionCommand {
  public name = 'ping';
  public description = 'Ping-pong!';

  public async run(ctx: InteractionContextExtended) {
    const { gateway, rest } = await ctx.client.ping();
    const text: string[] = [
      'REST: ' + rest + 'ms',
      'Gateway: ' + gateway + 'ms',
    ];
    const res = ctx.interactionCommandClient.application.voices.get(
      ctx.guildId
    );
    if (res) {
      let voice = await res.connection.gateway.ping();
      text.push('Voice: ' + voice + 'ms');
    }

    ctx.editOrRespond(
      'Pong! ' + text.join(' / ') + '. (shardId: ' + ctx.shardId + ')'
    );
  }
}
