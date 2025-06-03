import axios, { AxiosError, AxiosResponse } from 'axios';
import { FietError } from '../common/error/fiet-error';
import { TESTNET_ANCHOR } from '../common/utils/constants';
import { ResolveToml } from '../common/utils/resolveToml';
import { QuoteParams, QuoteResult, SEP38Info, SEP38InfoResponse } from './types';

export class Quote {
	assetsHash: Record<string, { id: string }> = {};
	testnetAnchor: string;

	/**
	 * Create a new Quote instance
	 * @param options Configuration options
	 */
	constructor(options?: { domain: string }) {
		this.testnetAnchor = options?.domain || TESTNET_ANCHOR;
	}

	async getQuote({ base, quote, amount, authToken, domain }: QuoteParams): Promise<QuoteResult> {
		try {
			const anchorDomain = domain || this.testnetAnchor;
			const { quotePoint: quoteUrl } = await this.getQuotePoint({ url: anchorDomain });

			if (Object.keys(this.assetsHash).length === 0) {
				await this.getInfo({ infoUrl: quoteUrl });
			}
			// Checking if both base and quote supported
			const baseExists = this.assetsHash[base];
			const quoteExists = this.assetsHash[quote];

			if (!baseExists || !quoteExists) {
				throw new Error(`Unsupported token: ${baseExists ? quote : base}`);
			}
			const response = await axios.get(`${quoteUrl}/price`, {
				params: {
					sell_asset: this.assetsHash[base].id,
					buy_asset: this.assetsHash[quote].id,
					sell_amount: amount,
					context: 'sep6',
				},
				headers: {
					Authorization: `Bearer ${authToken}`,
					'Content-Type': 'application/json',
				},
			});
			const data = response.data;

			return {
				price: data.price,
				sellAmount: data.sell_amount,
				buyAmount: data.buy_amount,
				fee: data.fee,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-38: ${axiosError.response}`, axiosError.code);
			}
			if (error instanceof Error) {
				throw new Error(`SEP-38: ${error.message}`);
			}
			throw new Error(`SEP-38: An unknown error occurred`);
		}
	}

	async getInfo(domain: { infoUrl: string }) {
		try {
			const response: AxiosResponse = await axios.get(`${domain.infoUrl}/info`);
			const data: SEP38InfoResponse = response.data;
			this.assetsMapping(data);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-38 Info: ${axiosError}, ${axiosError.code}`);
			}
			if (error instanceof Error) {
				throw new Error(`SEP-38 Info: ${error.message}`);
			}
			throw new Error('SEP-38 Info: An unknown error occurred');
		}
	}

	assetsMapping({ assets }: SEP38InfoResponse) {
		if (assets.length === 0) {
			throw new Error('Invalid SEP38 assets info');
		}
		assets.forEach((assetsInfo: SEP38Info) => {
			const assetId = assetsInfo.asset;
			const parts = assetId.split(':');
			const assetCode = parts[1];
			this.assetsHash[assetCode] = { id: assetId };
		});
	}

	/**
	 * Gets the ANCHOR_QUOTE_SERVER from the domain's stellar.toml file
	 * @param domain - The domain to get the web auth endpoint from
	 * @returns The SEP38 - quote endpoint URL
	 */
	async getQuotePoint(domain: { url: string }): Promise<{ quotePoint: string }> {
		try {
			const tomlResolver = new ResolveToml({ anchorUrl: domain.url });
			const tomlFile = await tomlResolver.getTomlFile();
			if (!tomlFile.ANCHOR_QUOTE_SERVER) {
				throw new Error(`No SEP38 url find in domain: ${domain}`);
			}
			return { quotePoint: tomlFile.ANCHOR_QUOTE_SERVER };
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-38 Url: ${axiosError}`, axiosError.code);
			}
			if (error instanceof Error) {
				throw new Error(`SEP38 Url: ${error.message}`);
			}
			throw new Error(`SEP-38 Url: An unknown error occurred`);
		}
	}
}
