import { ClusterClient } from 'detritus-client';

import AbstractCommunicationWrapper, { CommunicationWrapperOptions } from './abstract';

export default class ClusterServerCommunicationWrapper extends AbstractCommunicationWrapper<ClusterClient> {
  constructor(manager: ClusterClient) {
    super(manager);

    this.manager.manager?.on('ipc', (data) =>
      this.emit('message', data.op, data.data)
    );
  }

  public send(
    op: string,
    data: any,
    _?: CommunicationWrapperOptions<any>
  ): void {
    this.manager.manager?.send({ op, data });
  }

  public close(_?: any) {
    throw new Error('cannot close a parent process');
  }

  public destroy(): void {
    throw new Error('cannot destroy a parent process');
  }

  public ping(_?: any): number {
    return 0;
  }

  public reconnect(_?: any): void {
    throw new Error('cannot reconnect a parent process');
  }
}