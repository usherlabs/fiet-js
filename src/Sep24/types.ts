import type BigNumber from "bignumber.js";

/**
 * Parameters for initiating a withdrawal transaction via SEP-24
 *
 * A withdrawal allows users to convert Stellar assets to off-chain assets
 * (e.g., converting USDC on Stellar to USD in a bank account)
 */
export interface WithdrawParamas {
  /**
   * The Stellar account address where funds will be withdrawn from
   * Can be a regular Stellar address (G...) or a muxed account (M...)
   * Muxed accounts allow multiple sub-accounts under a single Stellar account
   */
  address: string;

  /**
   * The amount to withdraw in the quote asset (target off-chain asset)
   * This represents the amount the user wants to receive off-chain
   */
  quoteAmount: BigNumber;

  /**
   * Token symbol to withdraw
   */
  withdrawAsset?: string;
  /**
	 
	/**
	 * JWT authentication token obtained from SEP-10 Web Authentication
	 * Required to authenticate the user with the anchor service
	 */
  authToken: string;

  /**
   * Optional anchor domain to use for the withdrawal
   * If not provided, defaults to the configured testnet domain
   */
  domain?: string;
}

/**
 * Parameters for initiating a deposit transaction via SEP-24
 *
 * A deposit allows users to convert off-chain assets to Stellar assets
 * (e.g., converting USD from bank account to USDC on Stellar)
 */
export interface DepositParams {
  /**
   * The Stellar account address where deposited funds will be sent
   * Can be a regular Stellar address (G...) or a muxed account (M...)
   */
  address: string;

  /**
   * The amount to deposit in the base asset (source off-chain asset)
   * This represents the amount the user wants to deposit from off-chain
   */
  baseAmount: BigNumber;

  /**
   * Token symbol to deposit
   */
  depositAsset?: string;

  /**
   * JWT authentication token obtained from SEP-10 Web Authentication
   * Required to authenticate the user with the anchor service
   */
  authToken: string;

  /**
   * Optional anchor domain to use for the deposit
   * If not provided, defaults to the configured testnet domain
   */
  domain?: string;
}

/**
 * Result returned after initiating a SEP-24 transaction
 *
 * Contains information about the transaction and next steps for the user
 */
export interface StellarTransactionResult {
  /**
   * The type of interaction required from the user
   * Typically "interactive_customer_info_needed" for SEP-24 transactions
   */
  type: string;

  /**
   * URL to the anchor's interactive webpage
   * User must visit this URL to complete KYC, provide bank details,
   * or complete other required steps for the transaction
   */
  url: string;

  /**
   * Unique identifier assigned by the anchor for this transaction
   * Can be used to track transaction status and for customer support
   */
  anchorId: string;
}

/**
 * Asset configuration and limits from SEP-24 info endpoint
 */
export interface AssetDetails {
  /** Whether the asset is currently available for operations */
  enabled: boolean;
  /** Minimum transaction amount allowed */
  minAmount: BigNumber;
  /** Maximum transaction amount allowed */
  maxAmount: BigNumber;
}

/**
 * Asset information for SEP-24 operations
 */
export interface AssetInfoParams {
  /** Asset code (e.g., 'USDC', 'SRT', 'native') */
  assetCode: string;
  /** Operation type: deposit or withdraw */
  operation: "deposit" | "withdraw";
}

/**
 * Parameters for validating asset transactions
 */
export interface ValidateParams {
  /** Asset and operation information */
  assetInfo: AssetInfoParams;
  /** Transaction amount to validate against limits */
  amount: BigNumber;
}

export interface TransactionStatus {
  id: string;
  kind: string;
  status: string;
  more_info_url: string;
  amount_in?: string;
  amount_in_asset?: string;
  amount_out?: string;
  amount_out_asset?: string;
  fee_details?: {
    total: string;
    asset: string;
  };
  started_at: string;
  message: string;
  refunded: boolean;
  to: string;
}
