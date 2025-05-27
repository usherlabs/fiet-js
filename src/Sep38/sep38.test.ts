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
		it('should successfully get a quote with full asset discovery flow', async () => {
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
			// Verify the returned result
			expect(result).toEqual({
				price: '1.00',
				sell_amount: '102.00',
				buy_amount: '100.00',
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
		});
	});
});
