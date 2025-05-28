import axios from 'axios';
import { Quote } from '.';
import { ResolveToml } from '../common/utils/resolveToml';
import { mockInfoResponse, mockPriceResponse } from './mock/mockData';
// Mock the entire ResolveToml module
jest.mock('../common/utils/resolveToml');

// Get mocked modules
const mockedAxios = axios as any;
const MockedResolveToml = ResolveToml as any;

describe('SEP-38 Quote Integration Tests', () => {
	let quote: Quote;
	const mockAuthToken = 'test-auth-token';
	const mockDomain = 'testanchor.stellar.org';

	beforeEach(() => {
		// Reset only the mocks we actually use
		jest.clearAllMocks();

		// Create new Quote instance
		quote = new Quote();

		// Reset the ResolveToml mock
		MockedResolveToml.mockClear();
	});

	describe('SEP-38 flow', () => {
		it('should successfully get a quote', async () => {
			const mockResolveTomlInstance = {
				getTomlFile: jest.fn().mockResolvedValue({
					ANCHOR_QUOTE_SERVER: 'https://api.testanchor.stellar.org/sep38',
					WEB_AUTH_ENDPOINT: 'https://api.testanchor.stellar.org/auth',
					SIGNING_KEY: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B',
				}),
			};

			MockedResolveToml.mockImplementation(() => mockResolveTomlInstance as any);

			// Setup axios mocks in sequence
			mockedAxios.get.mockResolvedValueOnce(mockInfoResponse).mockResolvedValueOnce(mockPriceResponse);
			// Execute the full flow
			const result = await quote.getQuote({
				base: 'USD',
				quote: 'USDC',
				amount: '100',
				authToken: mockAuthToken,
				domain: mockDomain,
			});
			// Verify ResolveToml was instantiated correctly
			expect(MockedResolveToml).toHaveBeenCalledWith({ anchorUrl: mockDomain });
			expect(mockResolveTomlInstance.getTomlFile).toHaveBeenCalled();
			// Verify /price endpoint was called with correct parameters
			expect(mockedAxios.get).toHaveBeenNthCalledWith(
				2,
				'https://api.testanchor.stellar.org/sep38/price',
				{
					params: {
						sell_asset: 'iso4217:USD',
						buy_asset: 'stellar:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
						sell_amount: '100',
						context: 'sep6',
					},
					headers: {
						Authorization: `Bearer ${mockAuthToken}`,
						'Content-Type': 'application/json',
					},
				}
			);
			// Verify the returned result
			expect(result).toEqual({
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
			});

			expect(quote.assetsHash).toEqual({
				USD: { id: 'iso4217:USD' },
				USDC: { id: 'stellar:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' },
			});
		});

		it('should handle missing ANCHOR_QUOTE_SERVER', async () => {
			const mockResolveTomlInstance = {
				getTomlFile: jest.fn().mockResolvedValue({
					WEB_AUTH_ENDPOINT: 'https://api.testanchor.stellar.org/auth',
					// Missing ANCHOR_QUOTE_SERVER
				}),
			};

			MockedResolveToml.mockImplementation(() => mockResolveTomlInstance);

			await expect(
				quote.getQuote({
					base: 'USD',
					quote: 'USDC',
					amount: '100',
					authToken: mockAuthToken,
					domain: mockDomain,
				})
			).rejects.toThrow('No SEP38 url find in domain');
		});
	});

	describe('Asset Mapping', () => {
		it('should correctly map stellar assets', () => {
			quote.assetsMapping(mockInfoResponse.data);

			expect(quote.assetsHash).toEqual({
				USDC: { id: 'stellar:USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' },
				USD: { id: 'iso4217:USD' },
			});
		});

		it('should throw error for empty assets array', () => {
			expect(() => {
				quote.assetsMapping({ assets: [] });
			}).toThrow('Invalid SEP38 assets info');
		});
	});
});
