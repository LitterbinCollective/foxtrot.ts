// functions that could have been in index utils file, but
// cause crashes on scripts, such as run.ts.
import { Structures, Utils } from 'detritus-client';

import { GuildSettings } from '@/modules/models';
import { t } from '@/modules/managers/i18n';

import { Constants } from '.'; 

export { Paginator, PaginatorOptions } from './paginator';

export async function buildRuntimeErrorEmbed(
  guild: Structures.Guild,
  error: Error
) {
  const { name, message } = error;
  const embed = new Utils.Embed({
    title:
      Constants.EMOJIS.BOMB + ' ' + (await t(guild, 'runtime-error')),
    description: `**${name}**: ${message}`,
    color: Constants.EMBED_COLORS.ERROR,
  });

  return embed;
}

export async function buildArgumentErrorEmbed(
  guild: Structures.Guild,
  errors: Record<string, Error>
) {
  const embed = new Utils.Embed({
    title:
      Constants.EMOJIS.QUESTION_MARK +
      ' ' +
      (await t(guild, 'commands.argument-error')),
    color: Constants.EMBED_COLORS.ERROR,
  });

  const description: string[] = [];
  for (const key in errors) {
    const message = errors[key].message;
    const translated = await t(
      guild,
      'commands.' + message.toLowerCase().replaceAll(' ', '-')
    );
    description.push('`' + key + '`: ' + translated);
  }

  embed.setDescription(description.join('\n'));
  return embed;
}

const OPTIONS_PADDING = 2;

export async function listOptions(
  guild: Structures.Guild,
  name: string,
  options: { [key: string]: any },
  ranges: { [key: string]: number[] }
) {
  let description: string[][] | string = [];

  let keyValueMaximum = 0;
  let suffixMaximum = 0;
  for (const key in options) {
    const value = options[key];
    const range = ranges[key];
    const suffix = range ? `(${range[0]} to ${range[1]})` : '';
    const keyValue = key + ' = ' + value;
    keyValueMaximum = Math.max(keyValueMaximum, keyValue.length);
    suffixMaximum = Math.max(suffixMaximum, suffix.length);
    description.push([keyValue, suffix]);
  }

  description = description.reduce((prev, [keyValue, suffix]) => {
    const keyValueSpacing = ' '.repeat(
      keyValueMaximum - keyValue.length + OPTIONS_PADDING
    );
    const suffixSpacing = ' '.repeat(
      suffixMaximum - suffix.length + OPTIONS_PADDING
    );
    return prev + '\n' + keyValue + keyValueSpacing + suffixSpacing + suffix;
  }, '');

  return new Utils.Embed({
    title: await t(guild, 'commands.effect.options-for', name),
    description: Utils.Markup.codeblock(description),
    color: Constants.EMBED_COLORS.DEFAULT,
  });
}

export async function listEffects(
  guild: Structures.Guild,
  list: string[]
) {
  const description = [];
  for (let i = 0; i < Constants.VOICE_EFFECTS_STACK_LIMIT; i++)
    description.push(i + ')' + (list[i] ? ' ' + list[i] : ''));
  return new Utils.Embed({
    title: await t(guild, 'commands.effect.effects'),
    description: Utils.Markup.codeblock(description.join('\n')),
    color: Constants.EMBED_COLORS.DEFAULT,
  });
}

export async function listSettings(
  guild: Structures.Guild,
  settings: GuildSettings
) {
  const { properties } = GuildSettings.jsonSchema;
  const description = [];
  for (const key in properties)
    if (key !== GuildSettings.idColumn)
      description.push(
        key +
          ' = ' +
          (settings[key as keyof typeof settings]?.toString() ||
            (await t(guild, 'commands.settings.no-value')))
      );
  return new Utils.Embed({
    title: await t(guild, 'commands.settings.current'),
    color: Constants.EMBED_COLORS.DEFAULT,
    description: Utils.Markup.codeblock(description.join('\n')),
  });
}
