import ConfigApp from './app';
import ConfigFormats from './formats';
import ConfigGoogleAssistantSettings from './google-assistant-settings';
import ConfigShat from './shat';

export default interface Config {
  [key: string]: any,
  app: ConfigApp,
  formats: ConfigFormats,
  googleAssistantSettings: ConfigGoogleAssistantSettings,
  shat: ConfigShat,

  widevineClientId?: Buffer,
  widevinePrivateKey?: Buffer,
}