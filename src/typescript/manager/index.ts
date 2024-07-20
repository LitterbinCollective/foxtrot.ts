import '@/pre';

import { ClusterManager, } from 'detritus-client';
import * as Sentry from '@sentry/node';

import config from '@/managers/config'
import { Logger } from '@/utils';

const logger = new Logger('Runner');
const manager = new ClusterManager('../cluster/', config.app.token, {
  respawn: true,
  shardCount: config.app.shardCount || 1,
  shardsPerCluster: config.app.shardsPerCluster || 2,
  shards: [config.app.shardStart, config.app.shardEnd],
});

manager.on('clusterProcess', ({ clusterProcess }) => {
  const prefix = `Cluster [${clusterProcess.clusterId}]:`;

  clusterProcess.on('warn', ({ error }) =>
    logger.error(prefix, 'error:', error)
  );

  clusterProcess.on('close', ({ code, signal }) => {
    let message = 'closed: ' + code;
    if (signal)
      message += '/' + signal;

    if (code !== 0) {
      Sentry.captureMessage(prefix + ' ' + message);
      logger.error(prefix, message);
    } else
      logger.info(prefix, message);
  });
});

(async () => {
  logger.log('starting...');
  await manager.run();
  logger.info(
    `loaded ${manager.shardStart} - ${manager.shardEnd} shards out of ${manager.shardCount} total`
  );
})();
