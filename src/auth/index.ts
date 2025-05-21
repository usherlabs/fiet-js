import { Keypair, Networks, Transaction } from '@stellar/stellar-sdk';
import axios from 'axios';
import { AuthResult } from '../types/SEP10-types';
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
	async getAuthToken(options: { account: Keypair; domain?: string }): Promise<AuthResult> {
		try {
			const authurl = await this.getWebAuthPoint(options.domain || this.testnetDomain);
			// get SEP10 challenge transactions
			const responseChallenge = await axios.get(authurl, {
				params: {
					account: options.account.publicKey(),
				},
			});

			const challengeTransaction = await responseChallenge.data.transaction;

			// sign the `challengeTransaction`
			const transaction = new Transaction(challengeTransaction, this.networkPassphrase);
			transaction.sign(options.account);

			// Submit challenge
			const response = await axios.post(authurl, { transaction: transaction.toXDR() });
			const data = await response.data;
			return { token: data.token, account: options.account.publicKey() };
		} catch (error) {
			throw new Error(`Failed to authenticate with SEP10: ${error}`);
		}
	}

	/**
	 * Gets the WEB_AUTH_ENDPOINT from the domain's stellar.toml file
	 * @param domain - The domain to get the web auth endpoint from
	 * @returns The web auth endpoint URL
	 */
	async getWebAuthPoint(domain?: string): Promise<string> {
		try {
			const getDomain = domain || this.testnetDomain;
			const tomlResolver = new ResolveToml({ anchorUrl: getDomain });
			const tomlFile = await tomlResolver.getTomlFile();
			if (!tomlFile.WEB_AUTH_ENDPOINT) {
				throw new Error(`No SEP10 url find in domain: ${getDomain}`);
			}
			return tomlFile.WEB_AUTH_ENDPOINT;
		} catch (error) {
			throw new Error(`Failed to get the SEP10 url for domain: ${domain || this.testnetDomain}`);
		}
	}
}
