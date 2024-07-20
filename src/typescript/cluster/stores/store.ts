import { BaseCollection } from 'detritus-utils';

import Application from '@cluster/app';

export default class Store<K, V> extends BaseCollection<K, V> {
  private subscribers: Record<string, ((...args: any[]) => void)[]> = {};

  public applicationCreated(app: Application) {}

  public subscribe(event: string, func: (...args: any[]) => void) {
    if (!this.subscribers[event]) this.subscribers[event] = [];
    this.subscribers[event].push(func);
  }

  public unsubscribe(event: string, func: () => void) {
    if (!this.subscribers[event]) return;
    this.subscribers[event].splice(this.subscribers[event].indexOf(func), 1);
  }

  public emit(event: string, ...args: any[]) {
    if (!this.subscribers[event]) return;
    this.subscribers[event].forEach(func => func.call(this, ...args));
  }
}
