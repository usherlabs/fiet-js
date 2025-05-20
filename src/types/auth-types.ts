/**
 * Result of successful SEP-10 authentication
 */
export interface AuthResult {
	/**
	 * JWT token that can be used to authenticate further requests
	 */
	token: string;

	/**
	 * The authenticated account ID
	 * This will be the public key.
	 */
	account: string;
}
