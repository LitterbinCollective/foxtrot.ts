import { Constants as DetritusConstants, GatewayClientEvents, Structures } from 'detritus-client';

import NewVoice from '@cluster/voice';
import Application from '@cluster/app';
import { Constants, UserError } from '@cluster/utils';

import Store from './store';

class VoiceStore extends Store<string, NewVoice> {
  private cycleTimeout: NodeJS.Timeout | null = null;
  private nextCycle: number = 0;

  public applicationCreated(app: Application) {
    app.clusterClient.on(
      DetritusConstants.ClientEvents.VOICE_SERVER_UPDATE,
      (payload: GatewayClientEvents.VoiceServerUpdate) => {
        if (!payload.guildId) return;
        if (this.has(payload.guildId))
          this.get(payload.guildId)?.onVoiceServerUpdate(payload);
      }
    );

    app.clusterClient.on(
      DetritusConstants.ClientEvents.VOICE_STATE_UPDATE,
      (payload: GatewayClientEvents.VoiceStateUpdate) => {
        if (!payload.voiceState.guildId) return;
        if (this.has(payload.voiceState.guildId))
          this.get(payload.voiceState.guildId)?.onVoiceStateUpdate(payload);
      }
    );

    app.clusterClient.on(
      DetritusConstants.ClientEvents.GUILD_DELETE,
      (payload: GatewayClientEvents.GuildDelete) => {
        if (this.has(payload.guildId)) this.delete(payload.guildId);
      }
    );
  }

  private cycleOverVoices(iterator: IterableIterator<NewVoice>) {
    const next = iterator.next().value;

    if (!next) {
      if (this.nextCycle !== -1) {
        this.cycleTimeout = setTimeout(() => {
          this.nextCycle += Constants.OPUS_FRAME_LENGTH;
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

  public async create(
    voiceChannel: Structures.ChannelGuildVoice,
    textChannel: Structures.ChannelTextType
  ): Promise<NewVoice> {
    if (!textChannel.canMessage)
      throw new UserError('voice-check.not-enough-perms-send-messages');

    if (!voiceChannel.canJoin || !voiceChannel.canSpeak)
      throw new UserError('voice-check.not-enough-perms-speak');

    const channelSize = voiceChannel.memberCount || voiceChannel.members.size;
    if (voiceChannel.userLimit !== 0 && channelSize >= voiceChannel.userLimit)
      throw new UserError('voice-check.members-overflow');

    if (voiceChannel.guildId !== textChannel.guildId)
      throw new Error(
        'The specified text channel is not in the same ' +
          'guild as the specified voice channel'
      );

    if (this.has(voiceChannel.guildId))
      throw new UserError('voice-check.already-connected');

    const voice = new NewVoice(voiceChannel, textChannel);
    this.set(voiceChannel.guildId, voice);
    this.emit('voiceCreate', voiceChannel.guildId, voice);
    return voice;
  }

  public set(key: string, value: NewVoice): this {
    if (this.size === 0) this.initializeCycle();
    return super.set(key, value);
  }

  public delete(key: string): boolean {
    if (this.size - 1 === 0) this.killCycle();
    return super.delete(key);
  }

  public clear() {
    this.forEach(v => v.kill());
    this.killCycle();
    return super.clear();
  }
}

export default new VoiceStore();
