import type { Keypair } from "@stellar/stellar-sdk";

/**
 * Parameters for initiating SEP-10 Web Authentication
 *
 * SEP-10 authentication is a challenge-response protocol where the anchor
 * provides a challenge transaction that the user must sign to prove account ownership
 */
export interface AuthParams {
  /**
   * The Stellar keypair containing both public and private keys
   * Used to sign the challenge transaction provided by the anchor
   * The public key identifies the account being authenticated
   * The private key is used to sign the challenge transaction
   */
  account: Keypair;

  /**
   * Optional anchor domain to authenticate with
   * If not provided, defaults to the configured testnet domain
   * The domain is used to resolve the anchor's stellar.toml file
   * and find the WEB_AUTH_ENDPOINT for authentication
   */
  domain?: string;
}

/**
 * Result of successful SEP-10 authentication
 *
 * Contains the JWT token and account information needed for subsequent
 * authenticated requests to anchor services
 */
export interface AuthResult {
  /**
   * JWT token that can be used to authenticate further requests
   * This token contains claims about the authenticated account
   * and has an expiration time set by the anchor
   * Must be included in the Authorization header for authenticated requests
   */
  token: string;

  /**
   * The authenticated account ID
   * This will be the public key of the account that was successfully authenticated
   * Confirms which account the token is valid for
   */
  account: string;
}
