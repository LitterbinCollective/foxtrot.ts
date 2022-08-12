import Table from 'cli-table';
import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Embed, EmbedFooter, Markup } from 'detritus-client/lib/utils';
import { CatvoxCommandClient } from '../../../Application';

import { EMBED_COLORS, EMOJIS } from '../../../constants';
import { COLOR_REGEX } from '../../../logger/constants';
import { BaseVoiceCommand } from '../base';

export function listOptions(
  name: string,
  options: { [key: string]: any },
  ranges: { [key: string]: number[] }
) {
  const cli = new Table({
    head: ['Option', 'Current Value', 'Range'],
  });
  for (let key in options) {
    const range = ranges[key];
    cli.push([
      key,
      options[key],
      range ? `${range[0]} - ${range[1]}` : 'Unlimited',
    ]);
  }
  return new Embed({
    title: 'Options for ' + Markup.codestring(name),
    description: Markup.codeblock(cli.toString().split(COLOR_REGEX).join('')),
    color: EMBED_COLORS.DEF,
  });
}

export function listEffects(list: string[], max: number) {
  const cli = new Table({
    head: ['ID', 'Effect'],
    colWidths: [10, 30],
  });
  for (let i = 0; i < max; i++) cli.push([i, list[i] || '']);
  return new Embed({
    title: 'Effects',
    description: Markup.codeblock(cli.toString().split(COLOR_REGEX).join('')),
    color: EMBED_COLORS.DEF,
  });
}

export default class EffectDefaultCommand extends BaseVoiceCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'e',
      aliases: ['effect'],
      priority: -1,
    });
  }

  public run(ctx: Context) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice) return;

    const embed = new Embed({
      title: 'Available effects',
      description: Markup.codeblock(
        Object.keys(voice.effects.processors).join('\n')
      ),
      color: EMBED_COLORS.DEF,
    });
    ctx.reply({ embed });
  }
}
