import Table from 'cli-table';
import { Context, ParsedArgs } from 'detritus-client/lib/command'
import { CommandArgumentTypes } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';
import { DataTypes } from 'sequelize';

import { GMCommandClient } from '../../Application'
import { BaseCommand } from '../../BaseCommand'
import { ADMINISTRATOR_PERMISSION, COLOR_REGEX } from '../../constants';
import { attributes } from '../../models/settings';

export default class SettingsCommand extends BaseCommand {
  private readonly ATTR_BLACKLIST = [ 'createdAt', 'updatedAt', 'serverId' ];

  constructor (commandClient: GMCommandClient) {
    super(commandClient, {
      name: 'settings',
      label: 'selection',
      args: [{
        name: 'list',
        type: CommandArgumentTypes.BOOL,
        aliases: ['l']
      }, {
        name: 'set',
        type: CommandArgumentTypes.STRING,
        aliases: ['s'],
        consume: true
      }, {
        name: 'get',
        type: CommandArgumentTypes.BOOL,
        aliases: ['g'],
        consume: true
      }, {
        name: 'remove',
        type: CommandArgumentTypes.BOOL,
        aliases: ['r'],
        consume: true
      }]
    })
  }

  public onBeforeRun(context: Context, _: ParsedArgs) {
    return (context.member.permissions & ADMINISTRATOR_PERMISSION) === ADMINISTRATOR_PERMISSION;
  }

  public async run (ctx: Context, { selection, list, set, get, remove }: ParsedArgs) {
    const model = this.commandClient.application.sequelize.models.settings
    const settings = await model.findOne({ where: { serverId: ctx.guildId } })
    const commandsToExecute = {
      ['l_' + list]: () => {
        if (!settings)
          return ctx.reply('No settings have been set yet.')
        const tbl = new Table({
          head: ['Name', 'Current Value']
        })

        for (const name in attributes)
          this.ATTR_BLACKLIST.indexOf(name) === -1 &&
          tbl.push([ name, settings[name] || '[no value]' ])

        ctx.reply(Markup.codeblock(tbl.toString().split(COLOR_REGEX).join('')))
      },
      ['s_' + (typeof set !== 'undefined')]: async () => {
        let type = attributes[selection]
        if (!type || this.ATTR_BLACKLIST.indexOf(selection) !== -1) return ctx.reply('Unknown setting!')
        if (typeof type === 'object')
          type = type.type

        switch (type) {
          case DataTypes.STRING:
            break
          case DataTypes.BOOLEAN:
            set = set === 'true'
            break
          default:
            throw new Error('Could not convert given value to needed type! TODO: Add conversion method for ' + Markup.codestring(type) + '.')
        }

        if (!settings)
          await model.create({
            [selection]: set,
            serverId: ctx.guildId
          })
        else
          await settings.update({ [selection]: set })

        ctx.reply(Markup.codestring(selection) + ': => ' + Markup.codestring(settings[selection]))
      },
      ['g_' + get]: () => {
        if (!settings)
          return ctx.reply('No settings have been set yet.')
        if (!attributes[selection] || this.ATTR_BLACKLIST.indexOf(selection) !== -1)
          return ctx.reply('Unknown setting!')
        ctx.reply(Markup.codestring(selection) + ': ' + Markup.codestring(settings[selection]))
      },
      ['r_' + remove]: async () => {
        if (!settings)
          return ctx.reply('No settings have been set yet.')
        if (!attributes[selection] || this.ATTR_BLACKLIST.indexOf(selection) !== -1)
          return ctx.reply('Unknown setting!')
        await settings.update({ [selection]: null })
        ctx.reply(Markup.codestring(selection) + ': => ' + Markup.codestring('[no value]'))
      }
    }

    for (const command in commandsToExecute) { command.endsWith('true') && commandsToExecute[command]() }
  }
}
