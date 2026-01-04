const { MockBuda, mockLightningNetworkInvoices, MOCK_INVOICE } = require('../../mocks/buda-promise.mock');

jest.mock('../../../buda-promise/buda', () => MockBuda);

const { getInvoice } = require('../../../helpers/getInvoice');

describe('getInvoice helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUDA_API_KEY = 'test-api-key';
    process.env.BUDA_API_SECRET = 'test-api-secret';
  });

  it('should create invoice successfully with amount and msg', async () => {
    const amount = 5000;
    const msg = 'Test payment';

    const result = await getInvoice(amount, msg);

    expect(MockBuda).toHaveBeenCalledWith('test-api-key', 'test-api-secret');
    expect(mockLightningNetworkInvoices).toHaveBeenCalledWith(amount, 'BTC', msg, false);
    expect(result).toBe(MOCK_INVOICE);
  });

  it('should extract encoded_payment_request from response', async () => {
    const customInvoice = 'lnbc100u1custom';
    mockLightningNetworkInvoices.mockResolvedValueOnce({
      invoice: {
        encoded_payment_request: customInvoice,
        other_field: 'ignored'
      }
    });

    const result = await getInvoice(1000, 'test');

    expect(result).toBe(customInvoice);
  });

  it('should propagate error when Buda API fails', async () => {
    const apiError = new Error('Buda API error');
    mockLightningNetworkInvoices.mockRejectedValueOnce(apiError);

    await expect(getInvoice(5000, 'test')).rejects.toThrow('Buda API error');
  });
});
