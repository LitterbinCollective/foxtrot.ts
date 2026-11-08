export abstract class BaseTTSService {
  public abstract generate(content: string, add: string, userId: string): Buffer | Promise<Buffer | undefined | null> | undefined | null
}