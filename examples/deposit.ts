import { Keypair } from '@stellar/stellar-sdk';
import assert from 'assert';
import { BigNumber } from 'bignumber.js';
import dotenv from 'dotenv';
import { Auth } from '../src/Sep10';
import { Sep24Transactions } from '../src/Sep24';
dotenv.config();
/**
 * Get interactive URL for deposit
 */
async function main() {
	console.log('Init deposit...');
	let accountkey = process.env.STELLAR_PRIVATE_KEY;
	if (!accountkey) {
		throw new Error('Provide Stellar private Key');
	}
	const account = Keypair.fromSecret(accountkey);
	// Get auth token via SEP-10
	const sep10 = new Auth();
	const { token: authToken } = await sep10.getAuthToken({ account });

	// Init SEP-24 class
	const sep24 = new Sep24Transactions();
	const depositResponse = await sep24.performDeposit({
		address: account.publicKey(),
		baseAmount: BigNumber('10'),
		authToken,
	});

	assert(depositResponse.type, 'Invlid type');
	assert(depositResponse.url, 'Invlid Url');
	assert(depositResponse.anchorId, 'Invlid Anchor id');
	console.log('Deposit response: ', depositResponse);
	console.log('Finished deposit...');
}

main();
