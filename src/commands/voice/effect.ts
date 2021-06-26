import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';

import { CommandClientExtended } from '../../Application';
import BaseCommand from '../../BaseCommand';
import BaseEffect from '../../voice/baseStructures/BaseEffect';

export default class JoinCommand extends BaseCommand {
  constructor(commandClient: CommandClientExtended) {
    super(commandClient, {
      name: 'effect',
      aliases: ['e'],
      label: 'effect',
      type: CommandArgumentTypes.STRING,
      required: true,
      args: [
        { name: 'cmd', type: CommandArgumentTypes.STRING, required: true },
        { name: 'name' },
        { name: 'value' },
      ],
    });
  }

  public async run(ctx: Context, { effect, cmd, name, value }: ParsedArgs) {
    if (!ctx.member.voiceChannel)
      return ctx.reply('You are not in the voice channel.');

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) return ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel)
      return ctx.reply('You are not in the correct voice channel.');

    const afx: BaseEffect = res.effects.get(effect);
    if (!afx)
      return ctx.reply(
        'That effect does not exist! Here is a list of available effects you can use:\n```\n' +
          [...res.effects.keys()].join('\n') +
          '```'
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
        if (typeof afx.options[name] !== typeof value)
          return ctx.reply(
            'The type of `value` argument not equal to the type of a specified option!'
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
        const list = [];
        for (const name in afx.options)
          list.push(
            '`' +
              name +
              '`: `' +
              afx.options[name] +
              '`' +
              (afx.optionsRange[name]
                ? ' (' + afx.optionsRange[name].join(' - ') + ')'
                : '')
          );
        ctx.reply(list.join('\n'));
        break;
      default:
        return ctx.reply('enable, disable, set, get, list');
    }

    res.restart();
  }
}
