import { EventEmitter } from 'stream';

export type CommunicationWrapperOptions<T> = {
  id: T;
  [key: string]: any;
}

// the class has to also implement onMessage for events
export default abstract class AbstractCommunicationWrapper<T> extends EventEmitter {
  public manager: T;

  constructor(manager: T) {
    super();
    this.manager = manager;
  }

  public abstract send(
    op: string,
    data: any,
    options?: CommunicationWrapperOptions<any>
  ): void;

  public abstract close(id?: any): void;
  public abstract destroy(): void;
  public abstract ping(id?: any): number;
  public abstract reconnect(id?: any): void;
}