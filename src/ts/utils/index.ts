import { Embed, Markup } from 'detritus-client/lib/utils';
import { EMBED_COLORS } from '../constants';

export function durationInString(seconds: number) {
  const result = [~~(seconds / 60) % 60, ~~seconds % 60];
  let hours: number;
  if ((hours = ~~(seconds / 3600)) !== 0) result.unshift(hours);
  return result
    .map((n) => (n < 10 ? '0' + n.toString() : n.toString()))
    .join(':');
}

const OPTIONS_PADDING = 2;

export function listOptions(
  name: string,
  options: { [key: string]: any },
  ranges: { [key: string]: number[] }
) {
  let description: string[][] | string  = [];

  let keyValueMaximum = 0;
  let suffixMaximum = 0;
  for (const key in options) {
    const value = options[key];
    const range = ranges[key];
    const suffix = range ? `(${range[0]} to ${range[1]})` : '';
    const keyValue = key + ' = ' + value;
    keyValueMaximum = Math.max(keyValueMaximum, keyValue.length);
    suffixMaximum = Math.max(suffixMaximum, suffix.length);
    description.push([ keyValue, suffix ]);
  }

  description = description.reduce((prev, [ keyValue, suffix ]) => {
    const keyValueSpacing = ' '.repeat(keyValueMaximum - keyValue.length + OPTIONS_PADDING);
    const suffixSpacing = ' '.repeat(suffixMaximum - suffix.length + OPTIONS_PADDING);
    return prev + '\n' + keyValue + keyValueSpacing + suffixSpacing + suffix;
  }, '');

  return new Embed({
    title: 'Options for ' + Markup.codestring(name),
    description: Markup.codeblock(description),
    color: EMBED_COLORS.DEF,
  });
}

export function listEffects(list: string[], max: number) {
  const description = [];
  for (let i = 0; i < max; i++)
    description.push(i + ')' + (list[i] ? ' ' + list[i] : ''));
  return new Embed({
    title: 'Effects',
    description: Markup.codeblock(description.join('\n')),
    color: EMBED_COLORS.DEF,
  });
}

export { default as Logger } from './logger';
export { Paginator, PaginatorOptions } from './paginator'