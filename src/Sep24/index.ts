import axios, { AxiosError } from 'axios';
import { FietError } from '../common/error/fiet-error';
import { TESTNET_DOMAIN } from '../common/utils/constants';
import { ResolveToml } from '../common/utils/resolveToml';
import { DepositParams, StellarTransactionResult, WithdrawParamas } from './types';

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
					asset_code: 'USDC',
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
				throw new FietError(`SEP-24 Deposit Error: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`Failed to perform deposit with SEP-24: ${error}`);
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
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-24 Withdraw Error: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`Failed to perform withdraw with SEP-24: ${error}`);
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
				throw new Error(`No SEP-24 url find in domain: ${domain.url}`);
			}
			return tomlFile.TRANSFER_SERVER_SEP0024;
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-24 URL Error: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`Failed to get the SEP-24 url for ${domain} domain: ${error}`);
		}
	}
}
