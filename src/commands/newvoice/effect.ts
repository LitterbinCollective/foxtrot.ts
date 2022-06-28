import Table from 'cli-table';
import { Context } from 'detritus-client/lib/command';
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Embed, EmbedFooter, Markup } from 'detritus-client/lib/utils';

import { GMCommandClient } from '../../Application';
import { BaseCommand } from '../../BaseCommand';
import { COLOR_REGEX, EMBED_COLORS, EMOJIS } from '../../constants';

export default class EffectCommand extends BaseCommand {
  constructor(commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'e',
      aliases: ['effect'],
      type: [
        { name: 'command', type: CommandArgumentTypes.STRING, required: true },
        { name: 'effect', type: CommandArgumentTypes.STRING },
        { name: 'keyvalue', type: CommandArgumentTypes.STRING },
      ]
    });
  }

  private listEffects(list: string[], max: number) {
    const cli = new Table({
      head: ['ID', 'Effect'],
      colWidths: [10, 30],
    });
    for (let i = 0; i < max; i++)
      cli.push([ i, list[i] || '' ]);
    return new Embed({
      title: 'Effects',
      description: Markup.codeblock(cli.toString().split(COLOR_REGEX).join('')),
      color: EMBED_COLORS.DEF,
    });
  }

  private listOptions(name: string, options: { [key: string]: any }, ranges: { [key: string]: number[] }) {
    const cli = new Table({
      head: ['Option', 'Current Value', 'Range'],
    });
    for (let key in options) {
      const range = ranges[key];
      cli.push([ key, options[key], range ? `${range[0]} - ${range[1]}` : 'Unlimited' ]);
    }
    return new Embed({
      title: 'Options for ' + Markup.codestring(name),
      description: Markup.codeblock(cli.toString().split(COLOR_REGEX).join('')),
      color: EMBED_COLORS.DEF,
    });
  }

  public async run(ctx: Context, { command, effect, keyvalue }: { command: string, effect: string, keyvalue: string }) {
    if (!ctx.guild) return;
    const voice = this.commandClient.application.newvoices.get(ctx.guild.id);
    if (!voice)
      return await ctx.reply('Not in the voice channel.');
    if (!voice.initialized)
      return await ctx.reply('Voice not yet initialized!');

    switch (command) {
      case 'add': {
        const id = voice.effects.addEffect(effect);
        const embed = this.listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
        embed.title = EMOJIS.PLUS + ' Added effect ' + Markup.codestring(effect);
        embed.footer = new EmbedFooter({ text: 'Effect ID: ' + id });
        ctx.reply({ embed });
      } break;
      case 'remove': {
        voice.effects.removeEffect(parseInt(effect));
        const embed = this.listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
        embed.title = EMOJIS.MINUS + ' Removed effect ' + Markup.codestring(effect);
        ctx.reply({ embed });
      } break;
      case 'list': {
        const embed = this.listEffects(voice.effects.list, voice.effects.STACK_LIMIT);
        ctx.reply({ embed });
      } break;
      case 'clear': {
        voice.effects.clearEffects();
        ctx.reply('Effects cleared.');
      } break;
      case 'options': {
        const [ name, options, optionsRange ] = voice.effects.getEffectInfo(parseInt(effect));
        const embed = this.listOptions(name, options, optionsRange);
        ctx.reply({ embed });
      } break;
      case 'set': {
        const [key, value] = keyvalue.split('=').map((x: string) => x.trim());
        voice.effects.setValue(parseInt(effect), key, value);

        const [ name, options, optionsRange ] = voice.effects.getEffectInfo(parseInt(effect));
        const embed = this.listOptions(name, options, optionsRange);
        embed.title = EMOJIS.CHECK + ' Set ' + Markup.codestring(key) + ' to ' + Markup.codestring(value);
        embed.footer = new EmbedFooter({ text: 'Effect ID: ' + effect + ' (' + name + ')' });
        ctx.reply({ embed });
      } break;
      case 'get': {
        const value = voice.effects.getValue(parseInt(effect), keyvalue);
        ctx.reply(value);
      } break;
      default:
        ctx.reply('Unknown command.');
    }
  }
}
