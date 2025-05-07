import * as Sentry from '@sentry/node';

import config from '@/managers/config';
import { Logger } from './utils';
import ConsoleSink from './utils/logger/sinks/console';

Logger.log('🦊'.repeat(16));
Sentry.init({
  dsn: config.app.sentryDSN,
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  beforeBreadcrumb: ConsoleSink.sentryIgnore,
});