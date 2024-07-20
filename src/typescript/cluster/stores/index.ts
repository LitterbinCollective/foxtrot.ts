import Application from '@cluster/app';

export { default as Store } from './store';
export { default as GuildSettingsStore } from './guildsettings';
export { default as PaginatorsStore } from './paginators';
export { default as VoiceStore } from './voice';

export function applicationCreated(app: Application) {
  for (let key in exports) {
    const value = exports[key];
    if (typeof value === 'object') value.applicationCreated(app);
  }
}
