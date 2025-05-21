import { Keypair } from '@stellar/stellar-sdk';
import dotenv from 'dotenv';
import { Auth } from './auth';
import { QuoteSep38 } from './quoteSep38';

// Load environment variables
dotenv.config();

async function main() {
	if (!process.env.STELLAR_PRIVATE_KEY) {
		throw new Error('Provide STELLAR_PRIVATE_KEY in .env');
	}
	// get Auth token
	const auth = new Auth();
	const { token: authToken } = await auth.getAuthToken({
		account: Keypair.fromSecret(process.env.STELLAR_PRIVATE_KEY),
	});

	// get quote
	const quote = new QuoteSep38();
	const data = await quote.getQuote({
		base: 'SRT',
		quote: 'USD',
		amount: '100',
		authToken,
	});
	console.log(data);
}

main();