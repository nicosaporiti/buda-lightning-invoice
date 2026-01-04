const MOCK_INVOICE = 'lnbc50u1p0test123mockInvoiceBOLT11encodedstring';

const mockLightningNetworkInvoices = jest.fn().mockResolvedValue({
  invoice: {
    encoded_payment_request: MOCK_INVOICE
  }
});

const mockDeposits = jest.fn().mockResolvedValue({
  deposits: []
});

const MockBuda = jest.fn().mockImplementation(() => ({
  lightning_network_invoices: mockLightningNetworkInvoices,
  deposits: mockDeposits
}));

module.exports = {
  MockBuda,
  mockLightningNetworkInvoices,
  mockDeposits,
  MOCK_INVOICE
};
