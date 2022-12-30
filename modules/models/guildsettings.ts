import { Model } from 'objection';

export default class GuildSettings extends Model {
  public prefix?: string;
  public special!: boolean;

  static tableName = 'guildSettings';

  static jsonSchema = {
    type: 'object',

    properties: {
      guildId: { type: 'string' },
      prefix: { type: ['string', 'null'] },
      special: { type: ['boolean'], default: false },
    },
  };

  static get idColumn() {
    return 'guildId';
  }
}
