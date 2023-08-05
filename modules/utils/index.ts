import { Command, Interaction, Structures } from 'detritus-client';
import { RestClient } from 'detritus-client/lib/rest';
import { Client } from 'detritus-client-rest';

import config from '@/configs/app.json';

import * as constants from './constants';

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
export { default as Proxy } from './proxy';
