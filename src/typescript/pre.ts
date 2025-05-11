import * as Sentry from '@sentry/node';

import config from '@/managers/config';
import { branch, gitCommit, Logger } from './utils';
import ConsoleSink from './utils/logger/sinks/console';

Logger.log('🦊'.repeat(16), `(${branch}, ${gitCommit})`);
Sentry.init({
  dsn: config.app.sentryDSN,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  release: 'foxtrot.ts@' + gitCommit,
  beforeBreadcrumb: ConsoleSink.sentryIgnore,
});