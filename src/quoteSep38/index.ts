import axios, { AxiosError, AxiosResponse } from 'axios';
import { QuoteParams, QuoteResult, SEP38Info, SEP38InfoResponse } from '../types/SEP38-types';
import { TESTNET_DOMAIN } from '../utils/constants';
import { ResolveToml } from '../utils/resolveToml';

export class QuoteSep38 {
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
			const getDomain = domain || this.testnetDomain;
			const quoteUrl = await this.getQuotePoint(getDomain);

			if (Object.keys(this.assetsHash).length === 0) {
				await this.getInfo({ url: quoteUrl });
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
				sell_amount: data.sell_amount,
				buy_amount: data.buy_amount,
				fee: data.fee,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				console.error(axiosError.response?.data);
				throw new Error(`${axiosError.code}, error code: ${axiosError.status}`);
			}

			throw new Error(`Failed to get quote with SEP38`);
		}
	}

	async getInfo(option: { url: string }) {
		try {
			const response: AxiosResponse = await axios.get(`${option.url}/info`);
			const data: SEP38InfoResponse = await response.data;
			this.assetsMapping(data);
		} catch {
			throw new Error(`Failed to get SEP-38 info for domain: ${option.url}`);
		}
	}

	assetsMapping(infoResponse: SEP38InfoResponse) {
		if (!infoResponse) {
			throw new Error('Invalid SEP38 info');
		}
		infoResponse.assets.forEach((assetsInfo: SEP38Info) => {
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
	async getQuotePoint(domain: string): Promise<string> {
		try {
			const tomlResolver = new ResolveToml({ anchorUrl: domain });
			const tomlFile = await tomlResolver.getTomlFile();
			if (!tomlFile.ANCHOR_QUOTE_SERVER) {
				throw new Error(`No SEP38 url find in domain: ${domain}`);
			}
			return tomlFile.ANCHOR_QUOTE_SERVER;
		} catch (error) {
			throw new Error(`Failed to get the SEP38 url for domain: ${domain}`);
		}
	}
}
