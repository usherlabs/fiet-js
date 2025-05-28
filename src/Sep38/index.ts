import axios, { AxiosError, AxiosResponse } from 'axios';
import { FietError } from '../common/error/fiet-error';
import { TESTNET_DOMAIN } from '../common/utils/constants';
import { ResolveToml } from '../common/utils/resolveToml';
import { QuoteParams, QuoteResult, SEP38Info, SEP38InfoResponse } from './types';

export class Quote {
	assetsHash: Record<string, { id: string }> = {};
	testnetDomain: string;

	/**
	 * Create a new Quote instance
	 * @param options Configuration options
	 */
	constructor(options?: { domain?: string }) {
		this.testnetDomain = options?.domain || TESTNET_DOMAIN;
	}

	async getQuote({ base, quote, amount, authToken, domain }: QuoteParams): Promise<QuoteResult> {
		try {
			const anchorDomain = domain || this.testnetDomain;
			const { quotePoint: quoteUrl } = await this.getQuotePoint({ url: anchorDomain });

			if (Object.keys(this.assetsHash).length === 0) {
				await this.getInfo({ infoUrl: quoteUrl });
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
			const data = await response.data;

			return {
				price: data.price,
				sellAmount: data.sell_amount,
				buyAmount: data.buy_amount,
				fee: data.fee,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-38 Error: ${axiosError}, ${axiosError.code}`);
			}

			throw new Error(`SEP-38 Error: ${error}`);
		}
	}

	async getInfo(domain: { infoUrl: string }) {
		try {
			const response: AxiosResponse = await axios.get(`${domain.infoUrl}/info`);
			const data: SEP38InfoResponse = await response.data;
			this.assetsMapping(data);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				throw new FietError(`SEP-38 Error: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-38 Error: ${error}`);
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
				throw new FietError(`SEP-38 Error: ${axiosError}, ${axiosError.code}`);
			}
			throw new Error(`SEP-38 Error ${domain} domain: ${error}`);
		}
	}
}
