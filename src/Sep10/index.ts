import { Networks, Transaction } from '@stellar/stellar-sdk';
import axios from 'axios';
import { AuthParams, AuthResult } from '../types/SEP10-types';
import { TESTNET_DOMAIN } from '../utils/constants';
import { ResolveToml } from '../utils/resolveToml';

/**
 * Handles SEP-10 authentication with anchors
 */
export class Auth {
	networkPassphrase: Networks;
	testnetDomain: string;

	/**
	 * Create a new Auth instance
	 * @param options Configuration options
	 */
	constructor(options?: { networkPassPharse: Networks; domain: string }) {
		this.networkPassphrase = options?.networkPassPharse || Networks.TESTNET;
		this.testnetDomain = options?.domain || TESTNET_DOMAIN;
	}

	/**
	 * Authenticate with an anchor using SEP-10
	 * @param options options for authentication
	 * @returns auth token and account's public key
	 */
	async getAuthToken({ account, domain }: AuthParams): Promise<AuthResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
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
			const data = await response.data;
			return { token: data.token, account: account.publicKey() };
		} catch (error) {
			throw new Error(`Failed to authenticate with SEP10: ${error}`);
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
				throw new Error(`No SEP10 url find in domain: ${domain.url}`);
			}
			return { webAuthPoint: tomlFile.WEB_AUTH_ENDPOINT };
		} catch (error) {
			throw new Error(`Failed to get the SEP10 url for domain: ${domain || this.testnetDomain}`);
		}
	}
}
