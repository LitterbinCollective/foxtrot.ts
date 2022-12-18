import { Structures, Utils } from 'detritus-client';

import { GuildSettings } from '@/modules/models';

import config from '@/configs/app.json';
import * as constants from './constants';
import { RestClient } from 'detritus-client/lib/rest';

export function buildRuntimeErrorEmbed(error: Error) {
  const { name, message } = error;
  const embed = new Utils.Embed({
    title: Constants.EMOJIS.BOMB + ' Runtime Error',
    description: `**${name}**: ${message}`,
    color: Constants.EMBED_COLORS.ERROR,
  });

  return embed;
}

export function buildArgumentErrorEmbed(errors: Record<string, Error>) {
  const embed = new Utils.Embed({
    title: Constants.EMOJIS.QUESTION_MARK + ' Argument Error',
    color: Constants.EMBED_COLORS.ERROR,
  });

  const description: string[] = [];
  for (const key in errors) {
    const message = errors[key].message;
    description.push('`' + key + '`: ' + message);
  }

  embed.setDescription(description.join('\n'));
  return embed;
}

export function sendFeedback(rest: RestClient, content: string, user?: Structures.User) {
  let webhook: IConfigFeedbackWebhook = config.feedbackWebhook;
  if (!webhook)
    return false;
  
  content = content.replaceAll('@', '@\u200b');

  rest.executeWebhook(webhook.id, webhook.token, {
    content,
    username: user ?
      `${user.tag} (${user.id})` :
      'Anonymous',
    avatarUrl: user ? user.avatarUrl : undefined
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

export function listOptions(
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
    title: 'Options for ' + Utils.Markup.codestring(name),
    description: Utils.Markup.codeblock(description),
    color: Constants.EMBED_COLORS.DEFAULT,
  });
}

export function listEffects(list: string[], max: number) {
  const description = [];
  for (let i = 0; i < max; i++)
    description.push(i + ')' + (list[i] ? ' ' + list[i] : ''));
  return new Utils.Embed({
    title: 'Effects',
    description: Utils.Markup.codeblock(description.join('\n')),
    color: Constants.EMBED_COLORS.DEFAULT,
  });
}

export const NO_VALUE_PLACEHOLDER = '[no value]';

export function listSettings(settings: GuildSettings) {
  const { properties } = GuildSettings.jsonSchema;
  const description = [];
  for (const key in properties)
    if (key !== GuildSettings.idColumn)
      description.push(
        key +
          ' = ' +
          (settings[key as keyof typeof settings] || NO_VALUE_PLACEHOLDER)
      );
  return new Utils.Embed({
    title: 'Current guild-specific settings',
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
      value = Number(value);
      break;
    case 'boolean':
      value = !(value === undefined || value === false || value === 0 || value === '0' || value === 'false');
      break;
    case 'undefined':
      value = undefined;
      break;
    default:
      throw new Error(
        'could not convert given value to needed type! ' + type
      );
  }

  // safety check
  const type2 = typeof value;
  if (type !== type2)
    throw new Error(
      'the type of value is not equal to the type of a specified type: ' +
        type2 + ' !== ' + type
    );

  return value;
}

export const Constants = constants;
export { default as Logger } from './logger';
export { Paginator, PaginatorOptions } from './paginator';
