import { Keypair } from '@stellar/stellar-sdk';
import { BigNumber } from 'bignumber.js';
import dotenv from 'dotenv';
import { Auth } from '../Sep10';
import { InteractiveTransactions } from '../Sep24';
import { Quote } from '../Sep38';
dotenv.config();

async function main() {
	const account = Keypair.fromSecret(process.env.STELLAR_PRIVATE_KEY!);
	const sep10 = new Auth();
	const { token } = await sep10.getAuthToken({ account });
	const quote = new Quote();
	const getQuote = await quote.getQuote({
		base: 'USD',
		quote: 'USDC',
		amount: '2',
		authToken: token,
	});
	console.log(getQuote);
	const sep24 = new InteractiveTransactions();
	const d = await sep24.performDeposit({
		address: account.publicKey(),
		baseAmount: BigNumber('5'),
		authToken: token,
	});
	console.log(d);
}

main();
