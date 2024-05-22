import { PartialModelObject } from 'objection';

import { Application } from '@clu/app';

import GuildSettings from '../models/guildsettings';
import Store from './store';

class GuildSettingsStore extends Store<string, GuildSettings> {
  constructor() {
    super({ expire: 60 * 1000 });
  }

  public applicationCreated(app: Application) {
    app.clusterClient.on('guildDelete', payload => {
      this.delete(payload.guildId);
      this.queryDelete(payload.guildId);
    });
  }

  private async queryFindById(key: string): Promise<GuildSettings | undefined> {
    const settings = await GuildSettings.query().findById(key);
    if (settings) {
      this.set(key, settings);
      return settings;
    }
  }

  private async queryInsert(key: string): Promise<GuildSettings> {
    return await GuildSettings.query().insert({
      guildId: key,
    } as PartialModelObject<GuildSettings>);
  }

  private async queryDelete(key: string) {
    return await GuildSettings.query().deleteById(key);
  }

  public async getOrCreate(key: string): Promise<GuildSettings> {
    if (this.has(key)) return this.get(key) as GuildSettings;

    let object = await this.queryFindById(key);
    if (!object) {
      object = await this.queryInsert(key);
      this.set(key, object);
    }
    return object;
  }

  public delete(key: string): boolean {
    if (this.has(key)) super.delete(key);
    return true;
  }
}

export default new GuildSettingsStore();
