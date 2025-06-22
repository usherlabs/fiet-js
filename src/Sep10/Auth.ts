import { Networks, Transaction } from "@stellar/stellar-sdk";
import axios, { type AxiosError } from "axios";
import { FietError } from "../common/error/fiet-error";
import { TESTNET_ANCHOR } from "../common/utils/constants";
import { ResolveToml } from "../common/utils/resolveToml";
import type { AuthParams, AuthResult } from "./types";

/**
 * Handles SEP-10 authentication with anchors
 */
export class Auth {
  networkPassphrase: Networks;
  testnetAnchor: string;

  /**
   * Create a new Auth instance
   * @param options Configuration options
   */
  constructor(options?: { networkPassphrase: Networks; domain: string }) {
    this.networkPassphrase = options?.networkPassphrase || Networks.TESTNET;
    this.testnetAnchor = options?.domain || TESTNET_ANCHOR;
  }

  /**
   * Authenticate with an anchor using SEP-10
   * @param options options for authentication
   * @returns auth token and account's public key
   */
  async getAuthToken({ account, domain }: AuthParams): Promise<AuthResult> {
    try {
      const anchorDomain = domain || this.testnetAnchor;
      const { webAuthPoint } = await this.getWebAuthPoint({ url: anchorDomain });
      // get SEP10 challenge transactions
      const responseChallenge = await axios.get(webAuthPoint, {
        params: {
          account: account.publicKey(),
        },
      });

      const challengeTransaction = await responseChallenge.data.transaction;

      // sign the `challengeTransaction`
      const transaction = new Transaction(challengeTransaction, this.networkPassphrase);
      transaction.sign(account);

      // Submit challenge
      const response = await axios.post(webAuthPoint, { transaction: transaction.toXDR() });
      const data = response.data;
      return { token: data.token, account: account.publicKey() };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new FietError(`SEP-10: ${axiosError}`, axiosError.code);
      }
      if (error instanceof Error) {
        throw new Error(`SEP-10: ${error.message}`);
      }
      throw new Error("SEP-10: An unknown error occured");
    }
  }

  /**
   * Gets the WEB_AUTH_ENDPOINT from the domain's stellar.toml file
   * @param domain - The domain to get the web auth endpoint from
   * @returns The web auth endpoint URL
   */
  async getWebAuthPoint(domain: { url: string }): Promise<{ webAuthPoint: string }> {
    try {
      const tomlResolver = new ResolveToml({ anchorUrl: domain.url });
      const tomlFile = await tomlResolver.getTomlFile();
      if (!tomlFile.WEB_AUTH_ENDPOINT) {
        throw new Error(`No SEP-10 url find in domain: ${domain.url}`);
      }
      return { webAuthPoint: tomlFile.WEB_AUTH_ENDPOINT };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new FietError(`SEP-10 Url: ${axiosError}, ${axiosError.code}`);
      }
      if (error instanceof Error) {
        throw new Error(`SEP-10 Url: ${error.message}`);
      }
      throw new Error("SEP-10 Url: An unknown error occured");
    }
  }
}
