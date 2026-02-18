import { Constants, Structures } from 'detritus-client';
import { readFileSync } from 'fs';

import Application from '@cluster/app';
import { branch, Feedback } from '@cluster/utils';
import Store from './store';
import config from '@/managers/config';

const MAXIMUM_AGE = 1000 * 60 * 60 * 8;
const CHECK_INTERVAL = 1000 * 60 * 5;

// TODO: base class for cycle stores?
class FeedbackStore extends Store<string, Feedback> {
  private cycleTimeout: NodeJS.Timeout | null = null;
  private nextCycle: number = 0;

  constructor() {
    super();
    this.onGuildDelete = this.onGuildDelete.bind(this);
    this.cycle = this.cycle.bind(this);
  }

  private cycle(iterator: IterableIterator<[string, Feedback]>) {
    const next: [string, Feedback] = iterator.next().value;

    if (!next) {
      if (this.nextCycle !== -1) {
        this.cycleTimeout = setTimeout(() => {
          this.nextCycle += CHECK_INTERVAL;
          this.cycle(this.entries());
        }, this.nextCycle - Date.now());
      }
      return;
    }
    const [ id, feedback ] = next;

    if (Date.now() - feedback.createdAt > MAXIMUM_AGE)
      this.delete(id);

    setImmediate(() => this.cycle(iterator));
  }

  private initializeCycle() {
    this.nextCycle = Date.now();
    setImmediate(() => this.cycle(this.entries()));
  }

  private killCycle() {
    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
    }
    this.nextCycle = -1;
  }

  public applicationCreated(app: Application) {
    app.clusterClient.on(Constants.ClientEvents.GUILD_DELETE, this.onGuildDelete);
  }

  public create(channel: Structures.ChannelTextType) {
    if (!channel.guild)
      throw new Error('paginator cannot be created');
    const ban = config.ban.servers?.[channel.guild.id];
    const banCheck = typeof ban === 'object' ? ban.block : ban;
    if (branch === 'master' || branch === 'main' || banCheck)
      return null;
    if (this.has(channel.guild.id))
      return this.get(channel.guild.id)!;

    const feedback = new Feedback(channel);
    this.set(channel.guild.id, feedback);
    return feedback;
  }

  private onGuildDelete({ id }: { id: string }) {
    if (!id) return;
    this.delete(id);
  }

  public set(key: string, value: Feedback): this {
    if (this.size === 0) this.initializeCycle();
    return super.set(key, value);
  }

  public delete(key: string): boolean {
    if (this.size - 1 === 0) this.killCycle();
    return super.delete(key);
  }

  public clear() {
    this.killCycle();
    return super.clear();
  }
}

export default new FeedbackStore;
