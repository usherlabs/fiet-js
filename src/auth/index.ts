import { Keypair, Networks, Transaction } from '@stellar/stellar-sdk';
import axios from 'axios';
import { AuthResult } from '../types/auth-types';
import { ResolveToml } from '../utils/resolveToml';

/**
 * Handles SEP-10 authentication with anchors
 */
export class Auth {
	private readonly networkPassphrase: Networks;

	/**
	 * Create a new Auth instance
	 * @param options Configuration options
	 */
	constructor(options?: { networkPassPharse: Networks }) {
		this.networkPassphrase = options?.networkPassPharse || Networks.PUBLIC;
	}

	/**
	 * Authenticate with an anchor using SEP-10
	 * @param options options for authentication
	 * @returns auth token and account's public key
	 */
	async authenticate(options: { account: Keypair; domain: string }): Promise<AuthResult> {
		try {
			const authurl = await this.getWebAuthPoint(options.domain);
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

			return { token: response.data, account: options.account.publicKey() };
		} catch (error) {
			throw new Error(`Failed to authentocate with SEP10: ${error}`);
		}
	}

	/**
	 * Gets the WEB_AUTH_ENDPOINT from the domain's stellar.toml file
	 * @param domain - The domain to get the web auth endpoint from
	 * @returns The web auth endpoint URL
	 */
	async getWebAuthPoint(domain: string): Promise<string> {
		try {
			const tomlResolver = new ResolveToml({ anchorUrl: domain });
			const tomlFile = await tomlResolver.getTomlFile();
			if (!tomlFile.WEB_AUTH_ENDPOINT) {
				throw new Error(`No SEP10 url find in domain: ${domain}`);
			}
			return tomlFile.WEB_AUTH_ENDPOINT;
		} catch (error) {
			throw new Error(`Failed to get the SEP10 url for domain: ${domain}`);
		}
	}
}
