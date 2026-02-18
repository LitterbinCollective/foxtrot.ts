import ConfigApp from './app';
import ConfigSpecialSnowflakes from './ban';
import ConfigFormats from './formats';
import ConfigGoogleAssistantSettings from './google-assistant-settings';
import ConfigShat from './shat';

export default interface Config {
  [key: string]: any,
  app: ConfigApp,
  formats: ConfigFormats,
  googleAssistantSettings: ConfigGoogleAssistantSettings,
  shat: ConfigShat,
  ban: ConfigSpecialSnowflakes,

  widevineClientId?: Buffer,
  widevinePrivateKey?: Buffer,
}