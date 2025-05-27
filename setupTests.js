jest.mock('@stellar/stellar-sdk', () => ({
	StellarToml: {
		Resolver: {
			resolve: jest.fn(),
		},
		Api: {
			StellarToml: {},
		},
	},
	Networks: {
		TESTNET: 'Test SDF Network ; September 2015',
		PUBLIC: 'Public Global Stellar Network ; September 2015',
	},
	Keypair: {
		fromSecret: jest.fn(),
		fromPublicKey: jest.fn(),
	},
	Transaction: jest.fn(),
	BASE_FEE: '100',
}));

jest.mock('axios', () => ({
	__esModule: true,
	default: {
		get: jest.fn(),
		post: jest.fn(),
		isAxiosError: jest.fn(),
	},
	isAxiosError: jest.fn(),
}));
