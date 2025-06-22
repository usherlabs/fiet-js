import { StellarToml } from "@stellar/stellar-sdk";

export class ResolveToml {
  anchorToml: StellarToml.Api.StellarToml | undefined;
  anchorUrl: string;
  // caching mechanism
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 3600000; // 1 hour

  constructor(options: { anchorUrl: string }) {
    this.anchorUrl = options.anchorUrl;
  }

  async getTomlFile(options?: { anchorUrl?: string }): Promise<StellarToml.Api.StellarToml> {
    const currentTime = Date.now();
    if (this.anchorToml && currentTime - this.lastCacheTime < this.CACHE_DURATION) {
      return this.anchorToml;
    }
    try {
      this.anchorToml = await StellarToml.Resolver.resolve(options?.anchorUrl || this.anchorUrl);
      this.lastCacheTime = currentTime;
      return this.anchorToml;
    } catch (err) {
      throw new Error(`Failed to get Toml file: ${err}`);
    }
  }
}
