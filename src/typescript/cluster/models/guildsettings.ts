import { Model } from 'objection';

export default class GuildSettings extends Model {
  public allowCorrupt!: boolean;
  public ephemeral!: boolean;
  public prefix?: string;
  public special!: boolean;
  public lang?: string;
  public defaultVolume!: number;
  public tts?: string;
  public ttsTellMessageAuthor!: boolean;
  public ttsTellJoinLeave!: boolean;

  static tableName = 'guildSettings';

  static jsonSchema = {
    type: 'object',

    properties: {
      guildId: { type: 'string' },
      prefix: { type: ['string', 'null'] },
      special: { type: 'boolean', default: false },
      allowCorrupt: { type: 'boolean', default: false },
      lang: { type: ['string', 'null'] },
      ephemeral: { type: 'boolean', default: true },
      defaultVolume: { type: 'integer', default: 100 },
      tts: { type: ['string', 'null'] },
      ttsTellMessageAuthor: { type: 'boolean', default: false },
      ttsTellJoinLeave: { type: 'boolean', default: false },
    },
  };

  static get idColumn() {
    return 'guildId';
  }
}
