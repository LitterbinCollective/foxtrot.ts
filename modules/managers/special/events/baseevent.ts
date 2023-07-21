import { Timers } from 'detritus-utils';
import { readFileSync } from 'fs';

import app from '@/app';
import Voice from '@/modules/voice';

export class BaseEvent {
  public static timeRange: string[] = [];

  public async editAvatar(file: string, retry = true) {
    try {
      if (app.clusterClient.shardStart === 0)
        await app.clusterClient.rest.editMe({
          avatar: readFileSync('assets/images/' + file)
        });
    } catch (err) {
      if (retry) {
        await Timers.sleep(5000);
        await this.editAvatar(file, false);
      }
    }
  }

  public cleanUp() {}

  public onVoiceCreated(guildId: string, voice: Voice) {}
}
