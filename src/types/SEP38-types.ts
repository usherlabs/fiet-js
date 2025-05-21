/**
 * Parameters for requesting a SEP-38 quote
 * @param base The code of the asset you want to sell (e.g., "SRT")
 * @param quote The code of the asset you want to buy (e.g., "USD")
 * @param amount The amount of the base asset you want to sell
 * @param authToken JWT token obtained from SEP-10 authentication
 * @param domain Optional domain of the anchor (defaults to testnet anchor if not provided)
 */
export interface QuoteParams {
	base: string;
	quote: string;
	amount: string;
	authToken: string;
	domain?: string;
}

/**
 * Result of a successful SEP-38 quote request
 * @param price The quoted exchange rate
 * @param sell_amount The amount of the base asset to be sold (may include fees)
 * @param buy_amount The amount of the quote asset to be received
 * @param fee Optional fee information
 */
export interface QuoteResult {
	price: string;
	sell_amount: string;
	buy_amount: string;
	fee?: Fee;
}

/**
 * Fee information for a SEP-38 quote
 * @param total The total fee amount
 * @param asset The asset in which the fee is denominated
 * @param details Optional breakdown of the fee components
 */
interface Fee {
	total: string;
	asset: string;
	details?: Details[];
}

/**
 * Detailed breakdown of a fee component
 * @param name The name of the fee component
 * @param description A human-readable description of the fee
 * @param amount The amount of this specific fee component
 */
interface Details {
	name: string;
	description?: string;
	amount: string;
}

/**
 * Response from the SEP-38 /info endpoint
 * @param assets Array of assets available for trading
 */
export interface SEP38InfoResponse {
	assets: SEP38Info[];
}

/**
 * Information about an asset available through SEP-38
 * @param asset The asset identifier in SEP-38 format (e.g., "stellar:SRT:ISSUER" or "iso4217:USD")
 * @param country_codes Optional array of country codes where this asset is available
 * @param sell_delivery_methods Optional array of methods for delivering the asset when selling
 * @param buy_delivery_methods Optional array of methods for receiving the asset when buying
 */
export interface SEP38Info {
	asset: string;
	country_codes?: string[];
	sell_delivery_methods?: DeliveryMethod[];
	buy_delivery_methods?: DeliveryMethod[];
}
/**
 * Information about a delivery method for an asset
 * @param name Identifier for the delivery method
 * @param description Human-readable description of the delivery method
 */
export interface DeliveryMethod {
	name: string;
	description: string;
}
