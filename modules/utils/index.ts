import { Structures, Utils } from 'detritus-client';
import { RestClient } from 'detritus-client/lib/rest';
import { Client } from 'detritus-client-rest';

import { GuildSettings } from '@/modules/models';

import config from '@/configs/app.json';
import * as constants from './constants';

export function buildRuntimeErrorEmbed(error: Error) {
  const { name, message } = error;
  const embed = new Utils.Embed({
    title: Constants.EMOJIS.BOMB + ' Runtime Error',
    description: `**${name}**: ${message}`,
    color: Constants.EMBED_COLORS.ERROR,
  });

  return embed;
}

// 2 next functions taken from:
// https://github.com/fent/node-ytdl-core/blob/99e6c678eb8cf8f330479539ad08ab6a0d444322/lib/utils.js#L222
const normalizeIP = (ip: string) => {
  // Split by fill position
  const parts = ip.split('::').map(x => x.split(':'));
  // Normalize start and end
  const partStart = parts[0] || [];
  const partEnd = parts[1] || [];
  partEnd.reverse();
  // Placeholder for full ip
  const fullIP = new Array(8).fill(0);
  // Fill in start and end parts
  for (let i = 0; i < Math.min(partStart.length, 8); i++) {
    fullIP[i] = parseInt(partStart[i], 16) || 0;
  }
  for (let i = 0; i < Math.min(partEnd.length, 8); i++) {
    fullIP[7 - i] = parseInt(partEnd[i], 16) || 0;
  }
  return fullIP;
};

const IPV6_REGEX = /^(([0-9a-f]{1,4}:)(:[0-9a-f]{1,4}){1,6}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,6}(:[0-9a-f]{1,4})|([0-9a-f]{1,4}:){1,7}(([0-9a-f]{1,4})|:))\/(1[0-1]\d|12[0-8]|\d{1,2})$/;
/**
 * Quick check for a valid IPv6
 * The Regex only accepts a subset of all IPv6 Addresses
 *
 * @param {string} ip the IPv6 block in CIDR-Notation to test
 * @returns {boolean} true if valid
 */
const isIPv6 = (ip: string) => IPV6_REGEX.test(ip);

export function getRandomIPv6(ip: string) {
  // Start with a fast Regex-Check
  if (!isIPv6(ip)) throw Error('Invalid IPv6 format');
  // Start by splitting and normalizing addr and mask
  const [rawAddr, rawMask] = ip.split('/');
  let base10Mask = parseInt(rawMask);
  if (!base10Mask || base10Mask > 128 || base10Mask < 24) throw Error('Invalid IPv6 subnet');
  const base10addr = normalizeIP(rawAddr);
  // Get random addr to pad with
  // using Math.random since we're not requiring high level of randomness
  const randomAddr = new Array(8).fill(1).map(() => Math.floor(Math.random() * 0xffff));

  // Merge base10addr with randomAddr
  const mergedAddr = randomAddr.map((randomItem, idx) => {
    // Calculate the amount of static bits
    const staticBits = Math.min(base10Mask, 16);
    // Adjust the bitmask with the staticBits
    base10Mask -= staticBits;
    // Calculate the bitmask
    // lsb makes the calculation way more complicated
    const mask = 0xffff - ((2 ** (16 - staticBits)) - 1);
    // Combine base10addr and random
    return (base10addr[idx] & mask) + (randomItem & (mask ^ 0xffff));
  });
  // Return new addr
  return mergedAddr.map(x => x.toString(16)).join(':');
};

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
    username: typeof user === 'object' ? `${user.tag} (${user.id})` : (user || 'Anonymous'),
    avatarUrl: typeof user === 'object' ? user.avatarUrl : undefined,
    allowedMentions: {
      parse: [ 'users' ],
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
          (settings[key as keyof typeof settings]?.toString() ||
            NO_VALUE_PLACEHOLDER)
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
      value = +value;
      if (isNaN(value)) throw new UserError('invalid number value provided');
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

export class UserError extends Error {}

export const Constants = constants;
export { default as Logger } from './logger';
export { Paginator, PaginatorOptions } from './paginator';
export { default as Proxy } from './proxy';
