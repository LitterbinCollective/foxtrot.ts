import ConfigApp from './app';
import ConfigFormats from './formats';
import ConfigGoogleAssistantSettings from './google-assistant-settings';
import ConfigKnex from './knex';
import ConfigShat from './shat';

export default interface Config {
  [key: string]: any,
  app: ConfigApp,
  formats: ConfigFormats,
  googleAssistantSettings: ConfigGoogleAssistantSettings,
  knex: ConfigKnex,
  shat: ConfigShat,

  widevineClientId?: Buffer,
  widevinePrivateKey?: Buffer,
}