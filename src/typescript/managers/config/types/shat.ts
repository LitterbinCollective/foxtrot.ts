export default interface ConfigShat {
  gitHubToken: string,
  sources: {
    [key: string]: {
      bases: string[],
      useMsgPack: boolean
    }
  }
}