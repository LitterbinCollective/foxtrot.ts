declare interface IConfig {
  token: string
  sentryDSN: string
  feedbackWebhook: IConfigFeedbackWebhook
  googleAssistantSettings: IGoogleAssistantConfig
  formatCredentials: IConfigFormatCredentials
}

declare interface IConfigFormatCredentials {}

declare interface IConfigFeedbackWebhook {
  id: string,
  token: string
}

declare interface IGoogleAssistantConfigAuth {
  keyFilePath: string
  savedTokensPath: string
}

declare interface IGoogleAssistantConfigConversationAudio {
  encodingIn?: 'LINEAR16' | 'FLAC'
  sampleRateIn?: number
  encodingOut?: 'LINEAR16' | 'MP3' | 'OPUS_IN_OGG'
  sampleRateOut?: number
}

declare interface IGoogleAssistantConfigConversation {
  audio: IGoogleAssistantConfigConversationAudio
  lang: string
}

declare interface IGoogleAssistantConfig {
  auth: IGoogleAssistantConfigAuth
  conversation: IGoogleAssistantConfigConversation
}
