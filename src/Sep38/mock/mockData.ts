// Mock /info endpoint response
export const mockInfoResponse = {
	data: {
		assets: [
			{
				asset: 'iso4217:USD',
				country_codes: ['US'],
				sell_delivery_methods: [{ name: 'bank_account', description: 'Bank transfer' }],
				buy_delivery_methods: [{ name: 'bank_account', description: 'Bank transfer' }],
			},
			{
				asset: 'stellar:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
				sell_delivery_methods: [{ name: 'stellar', description: 'Stellar network' }],
				buy_delivery_methods: [{ name: 'stellar', description: 'Stellar network' }],
			},
		],
	},
};

// Mock /price endpoint response
export const mockPriceResponse = {
	data: {
		total_price: '1.02',
		price: '1.00',
		sellAmount: '102.00',
		buyAmount: '100.00',
		fee: {
			total: '2.00',
			asset: 'iso4217:USD',
			details: [
				{
					name: 'Service fee',
					amount: '2.00',
				},
			],
		},
	},
};
