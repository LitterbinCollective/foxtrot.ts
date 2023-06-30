import { Structures } from 'detritus-client';

import langs, { DEFAULT_LANG } from './lang';

const TEMPLATE_REGEX = /{(\d+)}/g;

let GuildSettingsStore: any;
async function translate(
  guild: Structures.Guild,
  id: string,
  ...values: any[]
) {
  if (!GuildSettingsStore)
    GuildSettingsStore = (await import('@/modules/stores')).GuildSettingsStore;
  const settings = await GuildSettingsStore.getOrCreate(guild.id);
  let lang = guild.preferredLocale.split('-')[0];

  if (settings.lang) lang = settings.lang;

  if (!(lang in langs)) lang = DEFAULT_LANG;

  const hierarchy = id.split('.');
  let template = id;

  let parent: any = langs[lang as keyof typeof langs];
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

export const t = translate;
