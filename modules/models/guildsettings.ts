import { Model } from 'objection';

export default class GuildSettings extends Model {
  public allowCorrupt!: boolean;
  public prefix?: string;
  public special!: boolean;
  public lang?: string;

  static tableName = 'guildSettings';

  static jsonSchema = {
    type: 'object',

    properties: {
      guildId: { type: 'string' },
      prefix: { type: ['string', 'null'] },
      special: { type: 'boolean', default: false },
      allowCorrupt: { type: 'boolean', default: false },
      lang: { type: ['string', 'null'] },
    },
  };

  static get idColumn() {
    return 'guildId';
  }
}
