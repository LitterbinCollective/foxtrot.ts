import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import config from '@/managers/config';

console.log('🦊'.repeat(16));

Sentry.init({
  dsn: config.app.sentryDSN,
  integrations: [
    nodeProfilingIntegration()
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});