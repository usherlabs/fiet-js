import axios, { AxiosError } from 'axios';
import { FietError } from '../common/error/fiet-error';
import { TESTNET_DOMAIN } from '../common/utils/constants';
import { ResolveToml } from '../common/utils/resolveToml';
import {
	AssetDetails,
	AssetInfoParams,
	DepositParams,
	StellarTransactionResult,
	ValidateParams,
	WithdrawParamas,
} from './types';

export class Sep24Transactions {
	testnetDomain: string;
	isAssetLoaded: boolean = false;
	supportedAssets: {
		deposit: Record<string, AssetDetails>;
		withdraw: Record<string, AssetDetails>;
	} = { deposit: {}, withdraw: {} };

	/**
	 * Create a new Auth instance
	 * @param options Configuration options
	 */
	constructor(options?: { domain: string }) {
		this.testnetDomain = options?.domain || TESTNET_DOMAIN;
	}

	async init({ domain }: { domain?: string }) {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const sep24Url = await this.getSEP24Point({ url: anchorDomain });
			await this.getSupportedAssets({ infoUrl: sep24Url });
			this.isAssetLoaded = true;
		} catch (error) {
			this.isAssetLoaded = false;
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-24 Init: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-24 Init: ${error}`);
		}
	}

	async performDeposit({
		address,
		baseAmount,
		depositAsset = 'USDC',
		authToken,
		domain,
	}: DepositParams): Promise<StellarTransactionResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const sep24Url = await this.getSEP24Point({ url: anchorDomain });
			if (!this.isAssetLoaded) {
				await this.getSupportedAssets({ infoUrl: sep24Url });
			}
			// Check if `depositAsset` supported
			if (!this.isAssetSupported({ assetCode: depositAsset, operation: 'deposit' })) {
				throw new Error(`Asset ${depositAsset} not supported`);
			}

			if (
				!this.validateAmount({
					assetInfo: { assetCode: depositAsset, operation: 'deposit' },
					amount: baseAmount,
				})
			) {
				throw new Error(`Invalid amount for Asset ${depositAsset}`);
			}
			// deposit
			const response = await axios.post(
				`${sep24Url}/transactions/deposit/interactive`,
				{
					asset_code: depositAsset,
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
				throw new FietError(`SEP-24 Deposit: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-24 Deposit: ${error}`);
		}
	}

	async performWithdraw({
		address,
		quoteAmount,
		withdrawAsset = 'SRT',
		authToken,
		domain,
	}: WithdrawParamas): Promise<StellarTransactionResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const sep24Url = await this.getSEP24Point({ url: anchorDomain });
			if (!this.isAssetLoaded) {
				await this.getSupportedAssets({ infoUrl: sep24Url });
			}

			// Check if `withdrawAsset` supported
			if (!this.isAssetSupported({ assetCode: withdrawAsset, operation: 'withdraw' })) {
				throw new Error(`Asset ${withdrawAsset} not supported`);
			}
			if (
				!this.validateAmount({
					assetInfo: { assetCode: withdrawAsset, operation: 'withdraw' },
					amount: quoteAmount,
				})
			) {
				throw new Error(`Invalid amount for Asset ${withdrawAsset}`);
			}
			const response = await axios.post(
				`${sep24Url}/transactions/withdraw/interactive`,
				{
					asset_code: withdrawAsset,
					account: address,
					amount: quoteAmount,
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
				throw new FietError(`SEP-24 Withdraw: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-24 Withdraw: ${error}`);
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
				throw new FietError(`SEP-24 URL : ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-24 URL: ${error}`);
		}
	}

	async getSupportedAssets({ infoUrl }: { infoUrl: string }) {
		try {
			const response = await axios.get(`${infoUrl}/info`);
			const infoData = response.data;

			if (infoData.deposit) {
				this.supportedAssets.deposit = Object.entries(infoData.deposit).reduce(
					(acc, [assetCode, assetData]: [string, any]) => {
						acc[assetCode.toUpperCase()] = {
							enabled: assetData.enabled || false,
							minAmount: assetData.min_amount || 0,
							maxAmount: assetData.max_amount || 0,
						};
						return acc;
					},
					{} as Record<string, AssetDetails>
				);
			}
			if (infoData.withdraw) {
				this.supportedAssets.withdraw = Object.entries(infoData.withdraw).reduce(
					(acc, [assetCode, assetData]: [string, any]) => {
						acc[assetCode.toUpperCase()] = {
							enabled: assetData.enabled || false,
							minAmount: assetData.min_amount || 0,
							maxAmount: assetData.max_amount || 0,
						};
						return acc;
					},
					{} as Record<string, AssetDetails>
				);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-24 Supported Assets : ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-24 Supported Assets: ${error}`);
		}
	}

	isAssetSupported({ assetCode, operation }: AssetInfoParams): boolean {
		const asset = this.supportedAssets[operation][assetCode.toUpperCase()];
		return asset ? asset.enabled : false;
	}

	getAssetDetails({ assetCode, operation }: AssetInfoParams): AssetDetails | null {
		return this.supportedAssets[operation][assetCode.toUpperCase()] || null;
	}

	getEnabledAssets({
		operation,
	}: {
		operation: 'deposit' | 'withdraw';
	}): Record<string, AssetDetails> {
		return Object.entries(this.supportedAssets[operation])
			.filter(([_, asset]) => asset.enabled)
			.reduce((acc, [code, asset]) => {
				acc[code] = asset;
				return acc;
			}, {} as Record<string, AssetDetails>);
	}

	getAssetLimits({
		assetCode,
		operation,
	}: AssetInfoParams): { min: BigNumber; max: BigNumber } | null {
		const asset = this.supportedAssets[operation][assetCode.toUpperCase()];
		return asset && asset.enabled ? { min: asset.minAmount, max: asset.maxAmount } : null;
	}

	validateAmount({ assetInfo, amount }: ValidateParams): boolean {
		const asset = this.supportedAssets[assetInfo.operation][assetInfo.assetCode.toUpperCase()];
		if (!asset || !asset.enabled) return false;

		return amount >= asset.minAmount && amount <= asset.maxAmount;
	}
}
