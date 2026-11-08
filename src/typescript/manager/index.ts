import '@/pre';

import { ClusterManager, } from 'detritus-client';
import * as Sentry from '@sentry/node';
import { rmSync, writeFileSync } from 'fs';

import config from '@/managers/config'
import { Logger } from '@/utils';
import com, { ManagerClientCommunicationWrapper } from '@/com';
import '@manager/managers/activities';

if (process.env.NODE_ENV === 'development') {
  Logger.debug('you seem to be running in development mode, creating a PID file...');

  const PID_FILE = '.pid';
  writeFileSync(PID_FILE, process.pid.toString());

  function cleanup() {
    try {
      rmSync(PID_FILE);
      Logger.debug('deleted PID file');
    } catch (err) {}
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

const manager = new ClusterManager('../cluster/', config.app.token, {
  respawn: true,
  shardCount: config.app.shardCount || 1,
  shardsPerCluster: config.app.shardsPerCluster || 2,
  shards: [config.app.shardStart, config.app.shardEnd],
});

const client = new ManagerClientCommunicationWrapper(manager);
com.addClient(client);

manager.on('clusterProcess', ({ clusterProcess }) => {
  const prefix = `Cluster [${clusterProcess.clusterId}]:`;

  clusterProcess.on('warn', ({ error }) =>
    Logger.error(prefix, 'error:', error)
  );

  clusterProcess.on('close', ({ code, signal }) => {
    let message = 'closed: ' + code;
    if (signal)
      message += '/' + signal;

    if (code !== 0) {
      Sentry.captureMessage(prefix + ' ' + message, { level: 'fatal' });
      Logger.error(prefix, message);
    } else
      Logger.info(prefix, message);
  });
});

(async () => {
  Logger.log('starting...');
  await manager.run();

  Logger.info(
    `loaded ${manager.shardStart} - ${manager.shardEnd} shards out of ${manager.shardCount} total`
  );
})();
