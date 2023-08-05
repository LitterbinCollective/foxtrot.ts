import { Structures } from 'detritus-client';

import { GuildSettingsStore } from '@/modules/stores';

import BaseManager from '..';

const DEFAULT_LANG = 'en';
const TEMPLATE_REGEX = /{(\d+)}/g;

export class I18NManager extends BaseManager<any> {
  constructor() {
    super({
      create: false,
      loggerTag: 'I18NManager',
      scanPath: 'i18n/lang/',
    });

    this.translate = this.translate.bind(this);
  }

  public async translate(
    guild: Structures.Guild,
    id: string,
    ...values: any[]
  ) {
    const settings = await GuildSettingsStore.getOrCreate(guild.id);

    let lang = guild.preferredLocale.split('-')[0];
    if (settings.lang) lang = settings.lang;
    if (!(lang in this.processors)) lang = DEFAULT_LANG;

    const hierarchy = id.split('.');
    let template = id;
    let parent: any = this.processors[lang as keyof typeof this.processors];
    for (let i = 0; i < hierarchy.length; i++) {
      const child = hierarchy[i];
      if (!(child in parent)) break;

      parent = parent[child as keyof typeof parent];

      if (i === hierarchy.length - 1)
        template = parent;
    }

    return template.replace(
      TEMPLATE_REGEX,
      (_match, number) => String(values[number]) || '?'
    );
  }
}

const manager = new I18NManager();

export default manager;
export const t = manager.translate;