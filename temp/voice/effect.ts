import { Context, ParsedArgs } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Message } from 'detritus-client/lib/structures';
import { Markup } from 'detritus-client/lib/utils';
import Table from 'cli-table';

import { CatvoxCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import BaseEffect from '../../voice/foundation/BaseEffect';
import { COLOR_REGEX, EMBED_COLORS, EMOJIS } from '../../constants';

export default class EffectCommand extends BaseCommand {
  constructor(commandClient: CatvoxCommandClient) {
    super(commandClient, {
      name: 'effect',
      aliases: ['e'],
      label: 'effect',
      type: CommandArgumentTypes.STRING,
      args: [
        {
          name: 'enable',
          type: CommandArgumentTypes.BOOL,
          aliases: ['e'],
        },
        {
          name: 'disable',
          type: CommandArgumentTypes.BOOL,
          aliases: ['d'],
        },
        {
          name: 'list',
          type: CommandArgumentTypes.BOOL,
          aliases: ['l'],
        },
        {
          name: 'set',
          type: CommandArgumentTypes.STRING,
          aliases: ['s'],
          consume: true,
        },
        {
          name: 'get',
          type: CommandArgumentTypes.STRING,
          aliases: ['g'],
          consume: true,
        },
      ],
    });
  }

  public async fancyReply(ctx: Context, title: string, description?: string) {
    return await ctx.reply({
      embed: {
        title,
        description,
        color: EMBED_COLORS.DEF,
      },
    });
  }

  public async run(
    ctx: Context,
    { effect, enable, disable, list, set, get }: ParsedArgs
  ) {
    if (!ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the voice channel.');
    }

    const res = this.commandClient.application.voices.get(ctx.guild.id);
    if (!res) return await ctx.reply('Not in the voice channel.');
    if (res.channel !== ctx.member.voiceChannel) {
      return await ctx.reply('You are not in the correct voice channel.');
    }
    if (!res.initialized) return await ctx.reply('Voice not yet initialized!');

    const effectList = Markup.codeblock([...res.effects.keys()].join('\n'));
    if (!effect)
      return await this.fancyReply(
        ctx,
        'List of available effects',
        effectList
      );

    const afx: BaseEffect = res.effects.get(effect);
    if (!afx) {
      return await this.fancyReply(
        ctx,
        'That effect does not exist!',
        effectList
      );
    }

    const commandsToExecute = {
      ['e_' + enable]: () => {
        afx.enabled = true;
        return true;
      },
      ['d_' + disable]: () => {
        afx.enabled = false;
        return true;
      },
      ['l_' + list]: () => {
        const tbl = new Table({
          head: ['Name', 'Current Value', 'Range'],
        });

        for (const name in afx.options)
          tbl.push([
            name,
            afx.options[name],
            afx.optionsRange[name] ? afx.optionsRange[name].join(' - ') : '',
          ]);

        this.fancyReply(
          ctx,
          null,
          Markup.codeblock(tbl.toString().split(COLOR_REGEX).join(''))
        );
        return false;
      },
      ['s_' + (typeof set !== 'undefined')]: () => {
        let [name, value] = set.split('=').map((x: string) => x.trim());
        if (afx.options[name] === undefined)
          return ctx.reply('Unknown setting!');
        if (!value) return ctx.reply('No value specified!');

        const type = typeof afx.options[name];
        switch (type) {
          case 'number':
            value = Number(value);
            break;
          case 'boolean':
            value = value === 'true';
            break;
          default:
            throw new Error(
              'Could not convert given value to needed type! TODO: Add conversion method for ' +
                Markup.codestring(type) +
                '.'
            );
        }

        if (type !== typeof value) {
          return ctx.reply(
            'The type of value is not equal to the type of a specified setting!'
          );
        }

        if (typeof value === 'number' && afx.optionsRange[name]) {
          const [min, max] = afx.optionsRange[name];
          if (!(value >= min && value <= max)) {
            return ctx.reply(`Given value out of range (${min} - ${max})!`);
          }
        }

        afx.options[name] = value;
        return true;
      },
      ['g_' + (typeof get !== 'undefined')]: () => {
        const option = afx.options[get];
        if (option === undefined) return ctx.reply('Unknown setting!');

        this.fancyReply(
          ctx,
          Markup.codestring(get) + ': ' + Markup.codestring(option)
        );
        return false;
      },
    };

    let restart: boolean | Message = false;
    let doToggle = true;
    for (const command in commandsToExecute) {
      if (command.endsWith('true')) {
        restart = restart || (await commandsToExecute[command]());
        doToggle = false;
      }
    }

    if (doToggle) {
      afx.enabled = !afx.enabled;
      restart = true;
    }

    if (restart === true) {
      res.restart();
      ctx.message.react(EMOJIS.OK);
    }
  }
}
