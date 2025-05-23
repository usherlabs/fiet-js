import axios, { AxiosError } from 'axios';
import { DepositParams, StellarTransactionResult, WithdrawParamas } from '../types/SEP24-types';
import { TESTNET_DOMAIN } from '../utils/constants';
import { ResolveToml } from '../utils/resolveToml';

export class InteractiveTransactions {
	testnetDomain: string;

	/**
	 * Create a new Auth instance
	 * @param options Configuration options
	 */
	constructor(options?: { domain: string }) {
		this.testnetDomain = options?.domain || TESTNET_DOMAIN;
	}

	async performDeposit({
		address,
		baseAmount,
		authToken,
		domain,
	}: DepositParams): Promise<StellarTransactionResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const sep24Url = await this.getSEP24Point({ url: anchorDomain });
			// deposit
			const response = await axios.post(
				`${sep24Url!}/transactions/deposit/interactive`,
				{
					asset_code: 'SRT',
					account: address,
					amount: baseAmount.toString(),
				},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
						'Content-Type': 'application/json',
					},
				}
			);
			return {
				type: response.data.type,
				url: response.data.url,
				anchorId: response.data.id,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;

				switch (axiosError.response?.status) {
					case 500:
						throw new Error(
							'Anchor service is experiencing technical difficulties. Please try again later.'
						);
					case 502:
						throw new Error('Anchor service is temporarily unavailable (Bad Gateway).');
					case 404:
						throw new Error('Endpoint not found. Check the URL.');
					default:
						throw new Error(
							`API error ${axiosError.response?.status}: ${axiosError.response?.statusText}`
						);
				}
			}
			throw error;
		}
	}

	async performWithdraw({
		address,
		quoteAmount,
		authToken,
		domain,
	}: WithdrawParamas): Promise<StellarTransactionResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const sep24Url = await this.getSEP24Point({ url: anchorDomain });

			const response = await axios.post(
				`${sep24Url!}/transactions/withdraw/interactive`,
				{
					asset_code: 'SRT',
					account: address,
					amount: quoteAmount,
				},
				{
					headers: {
						Authorization: `Bearer ${authToken}`,
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			);
			return {
				type: response.data.type,
				url: response.data.url,
				anchorId: response.data.id,
			};
		} catch (err) {
			console.error('Error withdrawing via SEP-24', err);
			throw err;
		}
	}

	/**
	 * Gets the TRANSFER_SERVER_SEP0024 from the domain's stellar.toml file
	 * @param domain - The domain to get the web auth endpoint from
	 * @returns The web auth endpoint URL
	 */
	async getSEP24Point(domain: { url: string }): Promise<string> {
		try {
			const tomlResolver = new ResolveToml({ anchorUrl: domain.url });
			const tomlFile = await tomlResolver.getTomlFile();
			if (!tomlFile.TRANSFER_SERVER_SEP0024) {
				throw new Error(`No SEP24 url find in domain: ${domain.url}`);
			}
			return tomlFile.TRANSFER_SERVER_SEP0024;
		} catch (error) {
			throw new Error(`Failed to get the SEP24 url for domain: ${domain || this.testnetDomain}`);
		}
	}
}
