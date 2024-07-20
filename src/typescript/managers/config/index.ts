import { readFileSync } from 'fs';
import { join } from 'path';
import { PackageJson, ValueOf } from 'type-fest';

import BaseManager from '..';
import Config from './types';

export class ConfigManager extends BaseManager<ValueOf<Config>> {
  declare public imported: Config & { packageJson: PackageJson };

  constructor() {
    super({
      loggerTag: 'Config',
      scanPath: 'configs/',
      file: true,
      watch: true,
      recursive: true,

      map(buf: Buffer) {
        const firstByte = buf.readInt8(0);

        if (firstByte === 0x7b || firstByte === 0x5b)
          return JSON.parse(buf.toString('utf-8'));

        return buf;
      }
    });

    this.imported.packageJson = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json')).toString('utf-8')
    );
  }

  watch() {
    const pre = 'config folder refresh event catched,';

    if (process.env.CLUSTER_ID) {
      this.logger.info(pre, 'shutting down...');
      process.exit(0);
    } else
      this.logger.warn(pre, 'not shutting down!');
  }

  public get packageJson() {
    return this.imported.packageJson;
  }

  public get app() {
    return this.imported.app;
  }

  public get formats() {
    return this.imported.formats;
  }

  public get googleAssistantSettings() {
    return this.imported.googleAssistantSettings;
  }

  public get knex() {
    return this.imported.knex;
  }

  public get shat() {
    return this.imported.shat;
  }
}

export default new ConfigManager;