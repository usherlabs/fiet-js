import { Keypair } from '@stellar/stellar-sdk';
import assert from 'assert';
import dotenv from 'dotenv';
import { Auth } from '../src/Sep10';
import { Quote } from '../src/Sep38';
dotenv.config();
/**
 * Get interactive URL for deposit
 */
async function main() {
	console.log('Init quote...');

	let accountkey = process.env.STELLAR_PRIVATE_KEY;
	if (!accountkey) {
		throw new Error('Provide Stellar private Key');
	}
	const account = Keypair.fromSecret(accountkey);
	const amount = '2';
	// Get auth token via SEP-10
	const sep10 = new Auth();
	const { token: authToken } = await sep10.getAuthToken({ account });
	const quote = new Quote();
	const quoteResponse = await quote.getQuote({
		base: 'USD',
		quote: 'US',
		amount,
		authToken,
	});

	assert(quoteResponse.price, 'Invalid amount');
	assert(quoteResponse.sellAmount, 'Invalid sell amount');
	assert(quoteResponse.buyAmount, 'Invalid buy amount');
	assert(quoteResponse.fee, 'Invalid fee details');
	console.log('Quote response: ', quoteResponse);
	console.log('Finish quote...');
}

main();
