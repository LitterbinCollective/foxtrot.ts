import { ClusterManager } from 'detritus-client';
import { ClusterProcess } from 'detritus-client/lib/cluster/process';

import AbstractCommunicationWrapper, { CommunicationWrapperOptions } from './abstract';

export default class ManagerClientCommunicationWrapper extends AbstractCommunicationWrapper<ClusterManager> {
  constructor(manager: ClusterManager) {
    super(manager);

    const onProcess = (process: ClusterProcess) =>
      process.on('message', (data: any) => this.emit('message', data.op, data.data));

    this.manager.processes.forEach(onProcess);
    this.manager.on('clusterProcess', ({ clusterProcess }) =>
      onProcess(clusterProcess)
    );
  }

  public send(
    op: string,
    data: any,
    options?: CommunicationWrapperOptions<number>
  ): void {
    if (options?.id) {
      const process = this.manager.processes.get(options.id);
      if (process) {
        process.process?.send({ op, data });
        return;
      }
    }

    this.manager.processes.forEach(process => {
      process.process?.send({ op, data });
    });
  }

  public close(id?: number): void {
    if (id) {
      const process = this.manager.processes.get(id);
      if (process) {
        process.process?.kill(9);
        return;
      }
    }

    this.manager.processes.forEach(process => process.process?.kill(9));
  }

  public destroy(): void {
    this.manager.respawn = false;
    this.close();
  }

  public ping(_?: number): number {
    return 0;
  }

  public reconnect(id?: number): void {
    if (!this.manager.respawn)
      throw new Error('reconnection not possible');
    return this.close(id);
  }
}