import { PartialModelObject } from 'objection';

import { Application } from '../application';
import GuildSettings from '../models/guildsettings';
import { Store } from './store';

class GuildSettingsStore extends Store<string, GuildSettings> {
  constructor() {
    super({ expire: 60 * 1000 });
  }

  private async getOriginal(key: string): Promise<GuildSettings | undefined> {
    const settings = await GuildSettings.query().findById(key);
    if (settings) {
      this.set(key, settings);
      return settings;
    }
  }

  private async createOriginal(key: string): Promise<GuildSettings> {
    return await GuildSettings.query().insert({
      guildId: key,
    } as PartialModelObject<GuildSettings>);
  }

  private async deleteOriginal(key: string) {
    return await GuildSettings.query().deleteById(key);
  }

  public async getOrCreate(key: string): Promise<GuildSettings> {
    if (this.has(key))
      return this.get(key) as GuildSettings;

    let object = await this.getOriginal(key);
    if (!object) {
      object = await this.createOriginal(key);
      this.set(key, object);
    }
    return object;
  }

  public delete(key: string): boolean {
    if (this.has(key))
      super.delete(key);
    return true;
  }

  public onApplication(application: Application): void {
    application.clusterClient.on('guildDelete', (payload) => {
      this.delete(payload.guildId);
      this.deleteOriginal(payload.guildId);
    });
  }
}

export default new GuildSettingsStore()