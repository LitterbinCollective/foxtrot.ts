import { Model } from 'objection';

export default class GuildSettings extends Model {
  public prefix?: string;

  static tableName = 'guildSettings';

  static jsonSchema = {
    type: 'object',

    properties: {
      guildId: { type: 'string' },
      prefix: { type: [ 'string', 'null' ] }
    }
  }

  static get idColumn() {
    return 'guildId';
  }
}