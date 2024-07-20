import dayjs from 'dayjs';
import { join } from 'path';

import { VoiceStore } from '@cluster/stores';
import Voice from '@cluster/voice';
import BaseManager from '@/managers';
import { BaseEvent } from './events/baseevent';

export class Special extends BaseManager<any> {
  public current?: BaseEvent;
  public interval: NodeJS.Timeout;

  constructor() {
    super({
      create: false,
      loggerTag: 'Special',
      scanPath: join(__dirname, 'events/'),
    });

    this.checkDate = this.checkDate.bind(this);
    this.interval = setInterval(this.checkDate, 60000);
    this.checkDate();

    VoiceStore.subscribe(
      'voiceCreate',
      (guildId: string, voice: Voice) =>
        this.current && this.current.onVoiceCreated(guildId, voice)
    );
  }

  // https://github.com/Metastruct/node-metaconcord/blob/master/app/services/discord/modules/discord-guild-icon.ts#L77
  public checkDate() {
    let matched = false;

    for (const eventName in this.imported) {
      const event = this.imported[eventName];

      if (event.timeRange.length !== 2) continue;

      const [start, end] = event.timeRange as string[];
      const [startDay, startMonth] = start.split('/').map(n => +n);
      const [endDay, endMonth] = end.split('/').map(n => +n);

      const now = dayjs();
      const day = now.date();
      const month = now.month() + 1;

      const inMonth = month >= startMonth && month <= endMonth;
      const correctDay =
        startDay <= (month > startMonth ? startDay : day) &&
        endDay >= (month < endMonth ? endDay : day);

      if (inMonth && correctDay) {
        if (!(this.current instanceof event)) {
          this.logger.log('switching current event to ' + event.name);
          if (this.current) this.current.cleanUp();
          this.current = new event();
        }
        matched = true;
      }
    }

    if (!matched && this.current) {
      this.current.cleanUp();
      this.current = undefined;
    }
  }
};

export default new Special();
