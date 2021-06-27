import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import Table from 'cli-table';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';
import BaseEffect from '../../voice/foundation/BaseEffect';

export default class EffectCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'effect',
      aliases: ['e'],
      label: 'effect',
      type: CommandArgumentTypes.STRING,
      args: [
        { name: 'c', type: CommandArgumentTypes.STRING, consume: true },
      ],
      metadata: {
        usage: [
          'mb!effect reverb -c enable',
          'mb!effect reverb -c set:reverberance:100'
        ]
      }
    });
  }

  public async run(ctx: Context, { effect, c }: ParsedArgs) {
    if (!ctx.member.voiceChannel)
      return ctx.reply('You are not in the voice channel.');

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) return ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel)
      return ctx.reply('You are not in the correct voice channel.');

    let [ cmd, name, value ] = c.split(':');

    const effectList = '```\n' + [...res.effects.keys()].join('\n') + '```';
    if (!effect) return ctx.reply(effectList);
    if (!cmd) return ctx.reply('Usage:\n' + this.metadata.usage.join('\n'));

    const afx: BaseEffect = res.effects.get(effect);
    if (!afx)
      return ctx.reply(
        'That effect does not exist! Here is a list of available effects you can use:\n' + effectList
      );

    switch (cmd) {
      case 'enable':
        afx.enabled = true;
        break;
      case 'disable':
        afx.enabled = false;
        break;
      case 'set':
        if (!name) return ctx.reply('No setting name specified!');
        if (!afx.options[name]) return ctx.reply('Unknown setting!');
        if (!value) return ctx.reply('No value specified!');

        switch (typeof afx.options[name]) {
          case 'number':
            value = Number(value)
            break;
          case 'boolean':
            value = value === 'true';
            break;
          default:
            throw new Error('Unknown type of `options`! TODO: Add conversion method for `' + typeof afx.options[name] + '`.');
        }

        if (typeof afx.options[name] !== typeof value)
          return ctx.reply(
            'The type of value is not equal to the type of a specified setting!'
          );

        if (typeof value === 'number' && afx.optionsRange[name]) {
          const [min, max] = afx.optionsRange[name];
          if (!(value >= min && value <= max))
            return ctx.reply(`Given value out of range (${min} - ${max})!`);
        }
        afx.options[name] = value;
        break;
      case 'get':
        if (!name) return ctx.reply('No setting name specified!');
        const option = afx.options[name];
        if (!option) return ctx.reply('Unknown setting!');
        ctx.reply('`' + name + '`: `' + option + '`');
        break;
      case 'list':
        const tbl = new Table({
          head: ['Name', 'Current Value', 'Range']
        });
        for (const name in afx.options)
          tbl.push([ name, afx.options[name], afx.optionsRange[name] ? afx.optionsRange[name].join(' - ') : '' ]);
        ctx.reply('```\n' + tbl.toString().split(/\u001b\[(?:\d*;){0,5}\d*m/g).join('') + '```');
        break;
      default:
        return ctx.reply('enable, disable, set, get, list');
    }

    res.restart();
  }
}
