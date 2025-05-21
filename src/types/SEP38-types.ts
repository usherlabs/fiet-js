/**
 * Params for SEP-38 quote
 */
export interface QuoteParams {
	base: string;
	quote: string;
	amount: string;
	authToken: string;
	domain?: string;
}

/**
 * Result of successful SEP-38 quote
 */
export interface QuoteResult {
	price: string;
	sell_amount: string;
	buy_amount: string;
	fee?: Fee;
}

interface Fee {
	total: string;
	asset: string;
	details?: Details;
}

interface Details {
	name: string;
	description: string;
	amount: string;
}

export interface SEP38InfoResponse {
	assets: SEP38Info[];
}

export interface SEP38Info {
	asset: string;
	country_codes?: string[];
	sell_delivery_methods?: object[];
	buy_delivery_methods?: object[];
}
