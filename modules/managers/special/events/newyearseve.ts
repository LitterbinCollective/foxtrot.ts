import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Constants as DetritusConstants, Utils } from 'detritus-client';
import { Timers } from 'detritus-utils';

import app from '@/app';
import sh from '@/modules/chatsounds';
import { t } from '@/modules/managers/i18n/';
import { GuildSettingsStore, VoiceStore } from '@/modules/stores';
import { Constants } from '@/modules/utils';
import Voice from '@/modules/voice';

import { BaseEvent } from './baseevent';

dayjs.extend(utc);

const UTC_OFFSETS = [
  {
    offset: -12,
    locations: 'U.S. Outlying Islands',
  },
  {
    offset: -11,
    locations: 'American Samoa, Niue, U.S. Outlying Islands',
  },
  {
    offset: -10,
    locations:
      'Cook Islands, French Polynesia, U.S. Outlying Islands, United States',
  },
  {
    offset: -9.5,
    locations: 'French Polynesia',
  },
  {
    offset: -9,
    locations: 'French Polynesia, United States',
  },
  {
    offset: -8,
    locations: 'Canada, Mexico, Pitcairn Islands, United States',
  },
  {
    offset: -7,
    locations: 'Canada, Mexico, United States',
  },
  {
    offset: -6,
    locations: 'Canada, Mexico, United States, etc.',
  },
  {
    offset: -5,
    locations: 'Brazil, Canada, Chile, United States, etc.',
  },
  {
    offset: -4,
    locations: 'Brazil, Canada, Greenland, U.S. Virgin Islands, etc.',
  },
  {
    offset: -3.5,
    locations: 'Canada',
  },
  {
    offset: -3,
    locations: 'Argentina, Brazil, Chile, Greenland, etc.',
  },
  {
    offset: -2,
    locations: 'Brazil, etc.',
  },
  {
    offset: -1,
    locations: 'Azores, Greenland',
  },
  {
    offset: 0,
    locations: 'Greenland, Iceland, Ireland, United Kingdom, etc.',
  },
  {
    offset: 1,
    locations:
      'Belgium, Denmark, France, Germany, Hungary, Italy, NL, Norway, Spain, etc.',
  },
  {
    offset: 2,
    locations:
      'Bulgaria, Estonia, Finland, Greece, Israel, Latvia, Russia, Ukraine, etc.',
  },
  {
    offset: 3,
    locations: 'Belarus, Russia, Ukraine, etc.',
  },
  {
    offset: 3.5,
    locations: 'Iran',
  },
  {
    offset: 4,
    locations: 'Georgia, Russia, etc.',
  },
  {
    offset: 4.5,
    locations: 'Afghanistan',
  },
  {
    offset: 5,
    locations: 'Kazakhstan, Russia, etc.',
  },
  {
    offset: 5.5,
    locations: 'India, Sri Lanka',
  },
  {
    offset: 5.75,
    locations: 'Nepal',
  },
  {
    offset: 6,
    locations: 'Bangladesh, Kazakhstan, Kyrgyzstan, Russia, etc.',
  },
  {
    offset: 6.5,
    locations: 'Cocos (Keeling) Islands, Myanmar',
  },
  {
    offset: 7,
    locations:
      'Cambodia, Christmas Island, Indonesia, Mongolia, Russia, Thailand, etc.',
  },
  {
    offset: 8,
    locations:
      'Australia, Brunei, China, Hong Kong, Indonesia, Macau, Malaysia, Singapore, etc.',
  },
  {
    offset: 8.75,
    locations: 'Australia',
  },
  {
    offset: 9,
    locations: 'Indonesia, Japan, Russia, South Korea, etc.',
  },
  {
    offset: 9.5,
    locations: 'Australia',
  },
  {
    offset: 10,
    locations: 'Australia, Guam, Micronesia, Papua New Guinea, Russia, etc.',
  },
  {
    offset: 10.5,
    locations: 'Australia',
  },
  {
    offset: 11,
    locations:
      'Australia, Micronesia, New Caledonia, Russia, Solomon Islands, etc.',
  },
  {
    offset: 12,
    locations: 'Fiji, Kiribati, Nauru, Norfolk Islands, Russia, Tuvalu, etc.',
  },
  {
    offset: 13,
    locations: 'Kiribati, New Zealand, Samoa, Tokelau, Tonga',
  },
  {
    offset: 13.75,
    locations: 'New Zealand',
  },
  {
    offset: 14,
    locations: 'Kiribati',
  },
];

export default class NewYearsEveEvent extends BaseEvent {
  public static timeRange = ['30/12', '31/12'];
  private interval!: NodeJS.Timeout;
  private lastUpdated: number = 0;
  private next = -1;

  constructor() {
    super();

    this.activityRun = this.activityRun.bind(this);

    for (let i = UTC_OFFSETS.length - 1; i >= 0; i--) {
      const date = dayjs().utcOffset(UTC_OFFSETS[i].offset * 60);
      if (date.date() === 31) {
        this.next = i;
        break;
      }
    }

    this.interval = setTimeout(
      () => (this.interval = setInterval(this.activityRun, 1000)),
      new Date().getTime() % 1000
    );

    this.editAvatar('avatar-winter.png');
  }

  private get nextLocation():
    | { offset: number; locations: string }
    | undefined {
    return UTC_OFFSETS[this.next];
  }

  private prettyTimezoneOffset(timezoneOffset: number) {
    const hours = ~~timezoneOffset;
    const parts = [Math.abs(hours), Math.abs(timezoneOffset % hours) * 60];
    return (
      (timezoneOffset < 0 ? '-' : '+') +
      parts.map(n => (n < 10 ? '0' + n.toString() : n.toString())).join(':')
    );
  }

  private activityRun() {
    let suffix = '';
    if (this.nextLocation) {
      const prettyTimezoneOffset = this.prettyTimezoneOffset(
        this.nextLocation?.offset as number
      );
      suffix = ` | ${Constants.EMOJIS.SOON} ${this.nextLocation?.locations} (UTC${prettyTimezoneOffset})`;

      const date = dayjs().utcOffset(this.nextLocation.offset * 60);
      if (date.hour() === 0 && date.date() === 1) return this.hit();
    }

    if (Date.now() - this.lastUpdated >= 60000) {
      app.clusterClient.shards.forEach(shard => {
        shard.gateway.setPresence({
          activity: {
            type: DetritusConstants.ActivityTypes.WATCHING,
            name: "New Year's Eve" + suffix,
          },
        });
      });

      this.lastUpdated = Date.now();
    }
  }

  private async hit() {
    this.next--;

    let buffers: any[] = [sh.newBuffer('westminster:realm(internal)')];

    const max = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < max; i++)
      buffers.push(
        sh.newBuffer(
          `fwlaunch:realm(internal)--${
            25 + Math.floor(Math.random() * 75)
          } fwex:realm(internal)`
        )
      );

    buffers = await Promise.all(buffers.map(v => v.audio()));

    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      if (!buffer) continue;
      VoiceStore.forEach(
        async voice => voice.special && voice.playSoundeffect(buffer)
      );

      const time = (i === 0 ? 3 : 0) + Math.random() * 3;
      await Timers.sleep(+time.toFixed(3) * 1000);
    }
  }

  private async announce(voice: Voice) {
    const prefix = app.commandClient.prefixes.custom.first();
    const guild = (voice.channel as any).guild;
    const embed = new Utils.Embed({
      title: await t(guild, 'special.nye.title'),
      color: Constants.EMBED_COLORS.DEFAULT,
      description: await t(guild, 'special.nye.description', Constants.APPLICATION_NAME),
      fields: [
        {
          name: await t(guild, 'special.to-disable'),
          value: Utils.Markup.codestring(`${prefix}settings set special false`),
        },
      ],
    });

    voice.queue.announcer.channel.createMessage({ embed });
  }

  public async onVoiceCreated(guildId: string, voice: Voice) {
    const settings = await GuildSettingsStore.getOrCreate(guildId);

    if (settings.special) {
      if (voice.initialized) this.announce(voice);
      else voice.once('initialized', () => this.announce(voice));
    }
  }

  public cleanUp() {
    clearInterval(this.interval);
  }
}
