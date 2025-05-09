import { Structures } from 'detritus-client';
import { join } from 'path';

import BaseManager from '@/managers';
import { getOrCreateSettings } from '@/db/queries';

const DEFAULT_LANG = 'en';
const TEMPLATE_REGEX = /{(\d+)}/g;

interface i18nLanguage {
  [key: string]: string | i18nLanguage | undefined;
}

interface i18nRoot extends i18nLanguage {
  _extends?: string;
}

export class I18NManager extends BaseManager<i18nRoot> {
  private resolved: Record<string, i18nRoot> = {};

  constructor() {
    super({
      create: false,
      logger: 'i18n',
      path: join(__dirname, 'lang/'),
    });

    this.translate = this.translate.bind(this);

    if (this.imported[DEFAULT_LANG]._extends)
      throw new Error(`default language (${DEFAULT_LANG}) cannot extend another language`);

    Object.keys(this.imported).forEach((lang) => this.resolve(lang));
  }

  private resolve(locale: string, seen = new Set<string>()): any {
    if (this.resolved[locale])
      return this.resolved[locale];

    if (!this.imported[locale]) {
      this.logger.warn(`locale ${locale} not found, falling back to default (${DEFAULT_LANG})`);
      return this.imported[DEFAULT_LANG];
    }

    const current = { ...this.imported[locale] };

    seen.add(locale);
    this.logger.debug('walking, resolving', [...seen.values()].join(' -> '));

    const baseLocale = current._extends;
    delete current._extends;

    if (baseLocale) {
      if (seen.has(baseLocale))
        throw new Error(`circular dependency detected for locale ${locale}`);

      const base = this.resolve(baseLocale, seen);
      this.resolved[locale] = { ...base, ...current };
    } else
      this.resolved[locale] = current;

    return this.resolved[locale];
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
      const settings = await getOrCreateSettings(guild.id);
      lang = guild.preferredLocale.split('-')[0];

      if (settings.lang && settings.lang in this.resolved)
        lang = settings.lang;

      if (!(lang in this.resolved))
        lang = DEFAULT_LANG;
    }

    const hierarchy = id.split('.');
    let template = id;

    let parent: any = this.resolved[lang as keyof typeof this.resolved];
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