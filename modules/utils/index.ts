import { Command, Interaction, Structures, Utils } from 'detritus-client';
import { RestClient } from 'detritus-client/lib/rest';
import { Client } from 'detritus-client-rest';

import { t } from '@/modules/translations';
import { GuildSettings } from '@/modules/models';
import config from '@/configs/app.json';

import * as constants from './constants';

export async function buildRuntimeErrorEmbed(
  guild: Structures.Guild,
  error: Error
) {
  const { name, message } = error;
  const embed = new Utils.Embed({
    title:
      Constants.EMOJIS.BOMB + ' ' + (await t(guild, 'commands.runtime-error')),
    description: `**${name}**: ${message}`,
    color: Constants.EMBED_COLORS.ERROR,
  });

  return embed;
}

// https://gitlab.com/Cynosphere/HiddenPhox/-/blob/ffa8ceec9203cb5667708538d4e520136929dbf6/src/lib/utils.js#L340
const HTML_ENTITIES = {
  nbsp: ' ',
  cent: '¢',
  pound: '£',
  yen: '¥',
  euro: '€',
  copy: '©',
  reg: '®',
  lt: '<',
  gt: '>',
  quot: '"',
  amp: '&',
  apos: "'"
};

export function parseHTMLEntities(str: string) {
  return str.replace(/&([^;]+);/g, function (entity, entityCode) {
    let match;

    if (entityCode in HTML_ENTITIES)
      return HTML_ENTITIES[entityCode as keyof typeof HTML_ENTITIES];
    else if ((match = entityCode.match(/^#x([\da-fA-F]+)$/)))
      return String.fromCharCode(parseInt(match[1], 16));
    else if ((match = entityCode.match(/^#(\d+)$/)))
      return String.fromCharCode(~~match[1]);
    else
      return entity;
  });
}

export function checkPermission(
  ctx: Interaction.InteractionContext | Command.Context,
  permission: bigint
) {
  if (!ctx.member) return false;
  return (ctx.member.permissions & permission) === permission;
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

export function sendFeedback(
  rest: RestClient | Client,
  content: string,
  user?: Structures.User | string
) {
  let webhook: IConfigFeedbackWebhook = config.feedbackWebhook;
  if (!webhook || webhook.id.length === 0 || webhook.token.length === 0)
    return false;

  rest.executeWebhook(webhook.id, webhook.token, {
    content,
    username:
      typeof user === 'object'
        ? `${user.tag} (${user.id})`
        : user || 'Anonymous',
    avatarUrl: typeof user === 'object' ? user.avatarUrl : undefined,
    allowedMentions: {
      parse: ['users'],
    },
  });

  return true;
}

export function durationInString(seconds: number) {
  const result = [~~(seconds / 60) % 60, ~~seconds % 60];
  let hours: number;
  if ((hours = ~~(seconds / 3600)) !== 0) result.unshift(hours);
  return result
    .map(n => (n < 10 ? '0' + n.toString() : n.toString()))
    .join(':');
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
  list: string[],
  max: number
) {
  const description = [];
  for (let i = 0; i < max; i++)
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

export function convertToType(value: any, type: string) {
  switch (type) {
    case 'string':
      value = value.toString();
      break;
    case 'number':
      value = +value;
      if (isNaN(value)) throw new UserError('invalid-number');
      break;
    case 'boolean':
      value = !(
        value === undefined ||
        value === false ||
        value === 0 ||
        value === '0' ||
        value === 'false' ||
        value === 'off'
      );
      break;
    case 'undefined':
      value = undefined;
      break;
    default:
      throw new Error('could not convert given value to needed type! ' + type);
  }

  // safety check
  const type2 = typeof value;
  if (type !== type2)
    throw new Error(
      'the type of value is not equal to the type of a specified type: ' +
        type2 +
        ' !== ' +
        type
    );

  return value;
}

export class UserError extends Error {
  public formatValues: any[];

  constructor(message?: string, ...values: any[]) {
    super(message);
    this.formatValues = values;
  }
}

export const Constants = constants;
export { default as Logger } from './logger';
export { Paginator, PaginatorOptions } from './paginator';
export { default as Proxy } from './proxy';
