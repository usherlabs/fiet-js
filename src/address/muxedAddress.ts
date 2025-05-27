import { Account, MuxedAccount, StrKey } from '@stellar/stellar-sdk';

export class StellarMuxedAccounts {
	static createMuxedAccounts({
		baseAccount,
		id,
		sequence,
	}: {
		baseAccount: string;
		id: string;
		sequence: string;
	}): { muxedAddress: string } {
		try {
			// Create a new MuxedAccount using the base account and the ID
			const muxedAccount = new MuxedAccount(new Account(baseAccount, sequence), id);
			return { muxedAddress: muxedAccount.accountId() };
		} catch (error) {
			console.error('Error creating muxed account', error);
			throw error;
		}
	}

	static isMuxedAccount({ address }: { address: string }): boolean {
		return StrKey.isValidMed25519PublicKey(address);
	}

	static getBaseAccount({ muxedAddress }: { muxedAddress: string }): string {
		if (!this.isMuxedAccount({ address: muxedAddress })) {
			throw new Error("Invalid address. Muxed account starts with 'M'");
		}
		return MuxedAccount.parseBaseAddress(muxedAddress);
	}

	static decodeMuxedAccount({ muxedAccount }: { muxedAccount: MuxedAccount }): {
		base: string;
		id: string;
	} {
		if (!this.isMuxedAccount({ address: muxedAccount.accountId() })) {
			throw new Error("Invalid address. Muxed account starts with 'M'");
		}
		return { base: muxedAccount.baseAccount().accountId(), id: muxedAccount.id() };
	}
}
