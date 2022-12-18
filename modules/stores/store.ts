import { BaseCollection } from 'detritus-utils';

import { Application } from '@/app/app';

export default class Store<K, V> extends BaseCollection<K, V> {
  public applicationCreated(app: Application) {}
}
