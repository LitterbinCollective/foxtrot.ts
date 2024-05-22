import { ClusterManager, Utils } from 'detritus-client';

import config from '@/configs/app.json';
import { Logger, sendFeedback } from '@clu/utils';

const logger = new Logger('Runner');
const manager = new ClusterManager('../', config.token, {
  respawn: true,
  shardCount: (config as any).shardCount || 1,
  shardsPerCluster: (config as any).shardsPerCluster || 2,
  shards: [config.shardStart, config.shardEnd],
});

manager.on('clusterProcess', ({ clusterProcess }) => {
  const prefix = `Cluster [${clusterProcess.clusterId}]:`;
  clusterProcess.on('warn', ({ error }) =>
    logger.error(prefix, 'error:', error)
  );

  clusterProcess.on('close', ({ code, signal }) => {
    let message = `closed: ${code}`;
    if (signal) message += '/' + signal;
    if (config.devId && config.devId.length > 0)
      sendFeedback(
        manager.rest,
        `<@${config.devId}> Cluster ${clusterProcess.clusterId} [${config.shardStart} ` +
          `- ${config.shardEnd}] has died: ${Utils.Markup.codestring(
            code + ' ' + signal
          )}`
      );
    logger.error(prefix, message);
  });
});

(async () => {
  logger.log('starting...');
  await manager.run();
  logger.info(
    `loaded ${manager.shardStart} - ${manager.shardEnd} shards out of ${manager.shardCount} total`
  );
})();
