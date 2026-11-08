import { Logger } from '@/utils';
import AbstractCommunicationWrapper from './wrappers/abstract';
import { WorkerData as YouTubeWorkerData } from '@/manager/managers/activities/activities/youtube';
import { WorkerData as SpotifyWorkerData } from '@/manager/managers/activities/activities/spotify';

enum InternalOpCodes {
  BROADCAST = 'BROADCAST',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_REQUEST = 'DATA_REQUEST',
}

export { default as ClusterServerCommunicationWrapper } from './wrappers/cluster';
export { default as ManagerClientCommunicationWrapper } from './wrappers/manager';

interface Data {
  [key: string]: any;
  _youtube?: YouTubeWorkerData;
  _youtubeDirty?: boolean;
  _spotify?: SpotifyWorkerData;
  _spotifyDirty?: boolean;
}

// for communication between the manager and cluster processes...
class CommunicationManager {
  public clients: AbstractCommunicationWrapper<any>[] = [];
  public servers: AbstractCommunicationWrapper<any>[] = [];
  private logger = Logger.clone(`CommunicationManager [${process.pid}]`);

  private _data: Data = {};
  public data;

  constructor() {
    this.getData = this.getData.bind(this);
    this.setData = this.setData.bind(this);
    this.data = new Proxy<Data>(this._data, {
      set: this.setData,
      get: this.getData,
    });
  }

  private getData(_: any, prop: string) {
    return this._data[prop];
  }

  private setData(_: any, prop: string, value: any) {
    this._data[prop] = value;
    this.broadcast(InternalOpCodes.DATA_UPDATE, { [prop]: value }, true, !prop.startsWith('_'));
    this.logger.debug('set data', prop, value);
    return true;
  }

  public onClientMessage(client: AbstractCommunicationWrapper<any>, op: string, data: any) {
    this.logger.debug('received from client', op, data);
    switch (op as InternalOpCodes) {
      case InternalOpCodes.BROADCAST:
        this.broadcast(data.op, data.data, true, false, client);
        break;

      case InternalOpCodes.DATA_UPDATE:
        this._data = { ...this._data, ...data };
        this.broadcast(InternalOpCodes.DATA_UPDATE, this._data, true, true, client);
        break;

      case InternalOpCodes.DATA_REQUEST:
        client.send(InternalOpCodes.DATA_UPDATE, this._data);
        break;
    }
  }

  public onServerMessage(server: AbstractCommunicationWrapper<any>, op: string, data: any) {
    this.logger.debug('received from server', op, data);
    switch (op as InternalOpCodes) {
      case InternalOpCodes.BROADCAST:
        this.broadcast(data.op, data.data, true, false);
        break;

      case InternalOpCodes.DATA_UPDATE:
        this._data = { ...this._data, ...data };
        this.broadcast(InternalOpCodes.DATA_UPDATE, data, true, false);
        break;
    }
  }

  public broadcast(
    op: string,
    data: any,
    local: boolean,
    global: boolean,
    exclude?: AbstractCommunicationWrapper<any> | AbstractCommunicationWrapper<any>[]
  ) {
    const str: string[] = [];
    if (local) str.push('L');
    if (global) str.push('G');
    this.logger.debug(`broadcasting (${str.join('')})`, op, data);

    const isExcluded = (wrapper: AbstractCommunicationWrapper<any>) =>
      (Array.isArray(exclude) && exclude.includes(wrapper)) ||
      (exclude && exclude === wrapper);

    if (local)
      this.clients.forEach(client => !isExcluded(client) && client.send(op, data));

    if (global)
      this.servers.forEach(server => !isExcluded(server) && server.send(op, data));
  }

  public addServer(server: AbstractCommunicationWrapper<any>) {
    server.on('message', (op: string, data: any) =>
      this.onServerMessage(server, op, data)
    );
    this.servers.push(server);
  }

  public addClient(client: AbstractCommunicationWrapper<any>) {
    client.on('message', (op: string, data: any) =>
      this.onClientMessage(client, op, data)
    );
    client.send(InternalOpCodes.DATA_UPDATE, this._data);
    this.clients.push(client);
  }
}

const com = new CommunicationManager;
export default com;
(global as any).com = com;