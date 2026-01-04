const { MockBuda, mockDeposits, MOCK_INVOICE } = require('../../mocks/buda-promise.mock');

jest.mock('../../../buda-promise/buda', () => MockBuda);

const { getPaymentConfirmation } = require('../../../helpers/getPaymentConfirmation');

describe('getPaymentConfirmation helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUDA_API_KEY = 'test-api-key';
    process.env.BUDA_API_SECRET = 'test-api-secret';
  });

  it('should return true when invoice is confirmed', async () => {
    mockDeposits.mockResolvedValueOnce({
      deposits: [
        {
          deposit_data: {
            invoice: {
              encoded_payment_request: MOCK_INVOICE
            }
          },
          state: 'confirmed'
        }
      ]
    });

    const result = await getPaymentConfirmation(MOCK_INVOICE);

    expect(MockBuda).toHaveBeenCalledWith('test-api-key', 'test-api-secret');
    expect(mockDeposits).toHaveBeenCalledWith('btc');
    expect(result).toBe(true);
  });

  it('should return false when invoice does not exist in deposits', async () => {
    mockDeposits.mockResolvedValueOnce({
      deposits: [
        {
          deposit_data: {
            invoice: {
              encoded_payment_request: 'different_invoice'
            }
          },
          state: 'confirmed'
        }
      ]
    });

    const result = await getPaymentConfirmation(MOCK_INVOICE);

    expect(result).toBe(false);
  });

  it('should return false when invoice exists but state is not confirmed', async () => {
    mockDeposits.mockResolvedValueOnce({
      deposits: [
        {
          deposit_data: {
            invoice: {
              encoded_payment_request: MOCK_INVOICE
            }
          },
          state: 'pending'
        }
      ]
    });

    const result = await getPaymentConfirmation(MOCK_INVOICE);

    expect(result).toBe(false);
  });

  it('should return false when deposits array is empty', async () => {
    mockDeposits.mockResolvedValueOnce({
      deposits: []
    });

    const result = await getPaymentConfirmation(MOCK_INVOICE);

    expect(result).toBe(false);
  });

  it('should propagate error when Buda API fails', async () => {
    const apiError = new Error('Buda API error');
    mockDeposits.mockRejectedValueOnce(apiError);

    await expect(getPaymentConfirmation(MOCK_INVOICE)).rejects.toThrow('Buda API error');
  });
});
