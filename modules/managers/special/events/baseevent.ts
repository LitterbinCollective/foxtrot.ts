import Voice from '@/modules/voice';

export class BaseEvent {
  public static timeRange: string[] = [];

  public kill() {}
  public cleanUp() {}

  public onVoiceCreated(guildId: string, voice: Voice) {}
}
