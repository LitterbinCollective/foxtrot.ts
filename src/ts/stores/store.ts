import { BaseCollection } from 'detritus-utils';
import { Application } from '../application';

export class Store<K, V> extends BaseCollection<K, V> {
  public onApplication(application: Application) {}
}

export function broadcastOnApplication(application: Application) {
  for (const key in require.cache) {
    if (key.includes(__dirname)) {
      const { default: store }: { default?: Store<any, any> } = require(key) || {};
      if (store && store instanceof Store) {
        store.onApplication(application);
      }
    }
  }
}