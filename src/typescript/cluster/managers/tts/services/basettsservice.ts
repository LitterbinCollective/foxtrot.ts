export abstract class BaseTTSService {
  public abstract generate(content: string): Buffer | Promise<Buffer | undefined | null> | undefined | null
}