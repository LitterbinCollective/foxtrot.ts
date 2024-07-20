import { Structures } from 'detritus-client';
import { join } from 'path';

import { GuildSettingsStore } from '@cluster/stores';
import BaseManager from '@/managers';

const DEFAULT_LANG = 'en';
const TEMPLATE_REGEX = /{(\d+)}/g;

export class I18NManager extends BaseManager<any> {
  constructor() {
    super({
      create: false,
      loggerTag: 'I18NManager',
      scanPath: join(__dirname, 'lang/'),
    });

    this.translate = this.translate.bind(this);
  }

  public async translate(
    guild: Structures.Guild,
    id: string,
    ...values: any[]
  ) {
    let lang = DEFAULT_LANG;
    if (typeof guild === 'string')
      lang = guild;
    else {
      const settings = await GuildSettingsStore.getOrCreate(guild.id);
      lang = guild.preferredLocale.split('-')[0];

      if (settings.lang && settings.lang in this.imported)
        lang = settings.lang;
    }

    const hierarchy = id.split('.');
    let template = id;

    let parent: any = this.imported[lang as keyof typeof this.imported];
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