export default interface ConfigApp {
  token: string,
  sentryDSN: string,
  prefix: string,
  feedbackWebhook: {
    id: string,
    token: string
  },
  devId: string,
  shardCount?: number,
  shardStart: number,
  shardEnd: number,
  shardsPerCluster?: number,
  soundIcon?: string
}