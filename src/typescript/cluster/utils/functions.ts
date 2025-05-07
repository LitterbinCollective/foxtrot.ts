import { Command, Interaction, Structures, Utils } from 'detritus-client';
import { RestClient } from 'detritus-client/lib/rest';
import { Client } from 'detritus-client-rest';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { t } from '@cluster/managers/i18n';
import config from '@/managers/config';
import { Constants } from '@cluster/utils';
import { guildSettings } from '@/db/schema';
import { GuildSettings } from '@/db/types';
import app from '@cluster/index';

import * as Sentry from '@sentry/node';

interface ContextLike {
  user: {
    id: string;
    username: string;
    discriminator: string;
  };
  message?: {
    id: string;
    content: string;
    timestamp: Date;
    editedTimestamp: Date | null;
  };
  channel: {
    id: string;
    name?: string;
    isDm: boolean;
  } | null;
  guild: {
    id: string;
    name: string;
    region?: string;
    memberCount?: number;
  } | null;
  shardId?: number;
}

export function defineDefaultSentryContext(ctx: ContextLike, scope: Sentry.Scope, settings?: GuildSettings) {
  scope.setUser({
    id: ctx.user.id,
    username: ctx.user.username,
    discriminator: ctx.user.discriminator,
  });

  if (ctx.guild)
    scope.setContext('guild', {
      id: ctx.guild.id,
      name: ctx.guild.name,
      region: ctx.guild.region,
      memberCount: ctx.guild.memberCount,
      settings
    });

  if (ctx.channel)
    scope.setContext('channel', {
      id: ctx.channel.id,
      name: ctx.channel.name,
      isDm: ctx.channel.isDm,
    });

  if (ctx.message)
    scope.setContext('message', {
      id: ctx.message.id,
      timestamp: ctx.message.timestamp,
      editedTimestamp: ctx.message.editedTimestamp,
      content: ctx.message.content,
    });

  scope.setContext('client', {
    shardId: ctx.shardId ?? 'unknown',
  });
}

export function logCommandErrorToSentry(
  ctx: ContextLike,
  settings: GuildSettings,
  error: Error,
  commandName: string,
  args: any
): string {
  let eventId = '';

  Sentry.withScope((scope) => {
    defineDefaultSentryContext(ctx, scope, settings);

    scope.setContext('command', {
      name: commandName,
      args
    });

    eventId = Sentry.captureException(error, {
      mechanism: {
        type: 'cmd_handler_' + ctx.constructor.name.toLowerCase(),
        handled: true
      }
    });
  });

  return eventId;
}


export async function buildRuntimeErrorEmbed(
  guild: Structures.Guild,
  id?: string
) {
  const embed = new Utils.Embed({
    title:
      app.emoji('BOMB') + ' ' + (await t(guild, 'runtime-error.title')),
    description: await t(guild, 'runtime-error.description'),
    color: Constants.EMBED_COLORS.ERROR,
  });

  if (id)
    embed.setFooter(Constants.EMOJIS.PAPERCLIP + ' ' + id);

  return embed;
}

export async function buildArgumentErrorEmbed(
  guild: Structures.Guild,
  errors: Record<string, Error>
) {
  const embed = new Utils.Embed({
    title:
      app.emoji('QUESTION_MARK') +
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
    const suffix = range ? `(${range[0]} - ${range[1]})` : '';
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
  const description = [];
  for (const column of getTableConfig(guildSettings).columns) {
    if (!column.primary)
      description.push(
        column.name +
          ' = ' +
          (settings[column.name as keyof typeof settings]?.toString() ||
            (await t(guild, 'commands.settings.no-value')))
      );
  }
  return new Utils.Embed({
    title: await t(guild, 'commands.settings.current'),
    color: Constants.EMBED_COLORS.DEFAULT,
    description: Utils.Markup.codeblock(description.join('\n')),
  });
}

export function sendFeedback(
  rest: RestClient | Client,
  content: string,
  user?: Structures.User | string
) {
  let webhook: IConfigFeedbackWebhook = config.app.feedbackWebhook;
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

export function durationInString(seconds: number) {
  const result = [~~(seconds / 60) % 60, ~~seconds % 60];
  let hours: number;
  if ((hours = ~~(seconds / 3600)) !== 0) result.unshift(hours);
  return result
    .map(n => (n < 10 ? '0' + n.toString() : n.toString()))
    .join(':');
}