declare module 'soundcloud-key-fetch';

declare interface IConfig {
  token: string;
  prefix: string;
  databaseDSN: string;
  feedbackWebhook: IConfigFeedbackWebhook;
  formatCredentials: IConfigFormatCredentials;
}

declare interface IConfigFormatCredentials {
  // spotify: IConfigSpotifyFormatCredentials;
  youtube: IConfigYouTubeFormatCredentials;
}

declare interface IConfigYouTubeFormatCredentials {
  ipv6: string;
}

/*
declare interface IConfigSpotifyFormatCredentials {
  clientId: string;
  clientSecret: string;
}
*/

declare interface IConfigFeedbackWebhook {
  id: string;
  token: string;
}
