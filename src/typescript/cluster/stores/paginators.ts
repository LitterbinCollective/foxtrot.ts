import { Collections, Command, Constants, Interaction, Structures } from 'detritus-client';

import Application from '@cluster/app';
import { Paginator, PaginatorOptions } from '@cluster/utils';
import Store from './store';

const MAXIMUM_PAGINATORS = 4;

class PaginatorsStore extends Store<string, Collections.BaseSet<Paginator>> {
  constructor() {
    super();
    this.onChannelDelete = this.onChannelDelete.bind(this);
    this.onGuildDelete = this.onGuildDelete.bind(this);
  }

  public applicationCreated(app: Application) {
    app.clusterClient.on(Constants.ClientEvents.CHANNEL_DELETE, this.onChannelDelete);
    app.clusterClient.on(Constants.ClientEvents.GUILD_DELETE, this.onGuildDelete);
  }

  public create(ctx: Command.Context | Interaction.InteractionContext, options: PaginatorOptions) {
    if (!ctx.channelId) throw new Error('paginator cannot be created');
    if (!this.has(ctx.channelId)) this.set(ctx.channelId, new Collections.BaseSet());

    const store = this;
    options.onKill = function (this: Paginator) {
      if (ctx.channelId && store.has(ctx.channelId)) {
        const paginators = store.get(ctx.channelId);
        paginators?.delete(this);
      }
    };

    const paginator = new Paginator(ctx, options);
    const paginators = this.get(ctx.channelId);
    if (paginators) {
      paginators.add(paginator);
      while (paginators.length > MAXIMUM_PAGINATORS) paginators.first()?.kill();
    }
    return paginator;
  }

  private onGuildDelete({ channels }: { channels: Collections.BaseCollection<string, Structures.Channel> }) {
    if (!channels) return;
    for (const [_, channel] of channels)
      this.onChannelDelete({ channel });
  }

  private onChannelDelete({ channel }: { channel: Structures.Channel }) {
    if (this.has(channel.id)) {
      for (const paginator of Object.values(this.get(channel.id)!))
        paginator.kill();
      this.delete(channel.id);
    }
  }
}

export default new PaginatorsStore();
