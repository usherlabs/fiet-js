import { Horizon } from "@stellar/stellar-sdk";
import { STELLAR_TESTNET_URL } from "../common/utils/constants";

export class StellarAccount {
  horizonServer: Horizon.Server;

  constructor(option?: { url: string }) {
    this.horizonServer = new Horizon.Server(option?.url || STELLAR_TESTNET_URL);
  }

  async getSequence({ address }: { address: string }) {
    try {
      const account = await this.horizonServer.loadAccount(address);
      return account.sequence;
    } catch (err) {
      console.error("Error loading account", err);
      throw err;
    }
  }
}
