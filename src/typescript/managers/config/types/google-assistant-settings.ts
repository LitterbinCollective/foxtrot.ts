export default interface ConfigGoogleAssistantSettings {
  location: {
    latitude: number,
    longitude: number
  },
  lang: string,
  allowedServers: string[]
}