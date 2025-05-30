import { Keypair } from '@stellar/stellar-sdk';
import assert from 'assert';
import { BigNumber } from 'bignumber.js';
import dotenv from 'dotenv';
import { Auth } from '../src/Sep10';
import { Sep24Transactions } from '../src/Sep24';
dotenv.config();
/**
 * Get interactive URL for withdraw
 */
async function main() {
	console.log('Init withdraw...');
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
	const withdrawResponse = await sep24.performWithdraw({
		address: account.publicKey(),
		quoteAmount: BigNumber('5'),
		authToken,
	});
	assert(withdrawResponse.type, 'Invlid type');
	assert(withdrawResponse.url, 'Invlid Url');
	assert(withdrawResponse.anchorId, 'Invlid Anchor id');
	console.log('Withdraw response: ', withdrawResponse);
	console.log('Finish withdraw...');
}

main();
