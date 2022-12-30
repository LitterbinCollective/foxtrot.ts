import dayjs from 'dayjs';
import { readdirSync } from 'fs';
import { VoiceStore } from '../stores';

import { Constants, Logger } from '../utils';
import Voice from '../voice';
import { BaseEvent } from './events/baseevent';

class Special {
  public current?: BaseEvent;
  public interval: NodeJS.Timeout;
  private readonly events: Record<string, any> = {};
  private readonly logger = new Logger('Special');

  constructor() {
    for (const fileName of readdirSync(__dirname + '/events')) {
      const name = fileName.replace(Constants.FILENAME_REGEX, '');
      const any: typeof BaseEvent = require('./events/' + fileName).default;
      if (!any) continue;
      this.events[name] = any;
    }

    this.checkDate = this.checkDate.bind(this);
    this.interval = setInterval(this.checkDate, 60000);
    this.checkDate();

    VoiceStore.subscribe(
      'voiceCreated',
      (guildId: string, voice: Voice) =>
        this.current && this.current.onVoiceCreated(guildId, voice)
    );
  }

  // https://github.com/Metastruct/node-metaconcord/blob/master/app/services/discord/modules/discord-guild-icon.ts#L77
  public checkDate() {
    let matched = false;

    for (const eventName in this.events) {
      const event = this.events[eventName];

      if (event.timeRange.length === 0) continue;

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

    if (!matched) this.current = undefined;
  }
}

export default new Special();
