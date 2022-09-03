import { GatewayClientEvents } from 'detritus-client';
import { ClientEvents } from 'detritus-client/lib/constants';
import { ChannelGuildVoice, ChannelTextType } from 'detritus-client/lib/structures';
import { Application } from '../application';

import NewVoice from '../voice/new';
import { Store } from './store';

class VoiceStore extends Store<string, NewVoice> {
  private cycleTimeout: NodeJS.Timeout | null = null;
  private nextCycle: number = 0;
  private readonly OPUS_FRAME_LENGTH = 20;

  private cycleOverVoices(iterator: IterableIterator<NewVoice>) {
    const next = iterator.next().value;

    if (!next) {
      if (this.nextCycle !== -1) {
        this.cycleTimeout = setTimeout(() => {
          this.nextCycle += this.OPUS_FRAME_LENGTH;
          this.cycleOverVoices(this.values());
        }, this.nextCycle - Date.now());
      }
      return;
    }

    next.update();
    setImmediate(() => this.cycleOverVoices(iterator));
  }

  private initializeCycle() {
    this.nextCycle = Date.now();
    setImmediate(() => this.cycleOverVoices(this.values()));
  }

  private killCycle() {
    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
    }
    this.nextCycle = -1;
  }

  public create(
    voiceChannel: ChannelGuildVoice,
    textChannel: ChannelTextType
  ): NewVoice {
    if (voiceChannel.guildId !== textChannel.guildId)
      throw new Error(
        'The specified text channel is not in the same ' +
          'guild as the specified voice channel'
      );

    if (this.has(voiceChannel.guildId))
      throw new Error(
        'Already connected to a voice channel on this server'
      );

    const voice = new NewVoice(voiceChannel, textChannel);
    this.set(voiceChannel.guildId, voice);
    return voice;
  }

  public set(key: string, value: NewVoice): this {
    if (this.size === 0)
      this.initializeCycle();
    return super.set(key, value);
  }

  public delete(key: string): boolean {
    if (this.size - 1 === 0)
      this.killCycle();
    return super.delete(key);
  }

  public clear() {
    this.forEach(v => v.kill());
    this.killCycle();
    return super.clear();
  }

  public onApplication({ clusterClient: cluster }: Application): void {
    cluster.on(ClientEvents.VOICE_SERVER_UPDATE, (payload: GatewayClientEvents.VoiceServerUpdate) => {
      if (!payload.guildId) return;
      if (this.has(payload.guildId))
        this.get(payload.guildId)?.onVoiceServerUpdate(payload);
    });

    cluster.on(ClientEvents.VOICE_STATE_UPDATE, (payload: GatewayClientEvents.VoiceStateUpdate) => {
      if (!payload.voiceState.guildId) return;
      if (this.has(payload.voiceState.guildId))
        this.get(payload.voiceState.guildId)?.onVoiceStateUpdate(payload);
    });

    cluster.on(ClientEvents.GUILD_DELETE, (payload: GatewayClientEvents.GuildDelete) => {
      if (this.has(payload.guildId))
        this.delete(payload.guildId);
    })
  }
}

export default new VoiceStore()