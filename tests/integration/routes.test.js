const request = require('supertest');
const { MockBuda, mockLightningNetworkInvoices, mockDeposits, MOCK_INVOICE } = require('../mocks/buda-promise.mock');

jest.mock('../../buda-promise/buda', () => MockBuda);

const app = require('../../index');

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BUDA_API_KEY = 'test-api-key';
    process.env.BUDA_API_SECRET = 'test-api-secret';
  });

  describe('POST /newinvoice', () => {
    it('should return 200 with valid body', async () => {
      mockLightningNetworkInvoices.mockResolvedValue({
        invoice: { encoded_payment_request: MOCK_INVOICE }
      });

      const response = await request(app)
        .post('/newinvoice')
        .send({ amount: 5000, msg: 'Test payment' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        invoice: MOCK_INVOICE,
        amount: 5000,
        msg: 'Test payment'
      });
    });

    it('should return 400 when amount is missing', async () => {
      const response = await request(app)
        .post('/newinvoice')
        .send({ msg: 'Test payment' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.amount).toBeDefined();
    });

    it('should return 400 when msg is missing', async () => {
      const response = await request(app)
        .post('/newinvoice')
        .send({ amount: 5000 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.msg).toBeDefined();
    });

    it('should return 400 when amount is not numeric', async () => {
      const response = await request(app)
        .post('/newinvoice')
        .send({ amount: 'abc', msg: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.amount).toBeDefined();
    });

    it('should return 400 when amount is less than 1', async () => {
      const response = await request(app)
        .post('/newinvoice')
        .send({ amount: 0, msg: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.amount).toBeDefined();
    });

    it('should return 400 when msg is empty', async () => {
      const response = await request(app)
        .post('/newinvoice')
        .send({ amount: 5000, msg: '' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.msg).toBeDefined();
    });
  });

  describe('POST /status', () => {
    it('should return 200 with status true when invoice is paid', async () => {
      mockDeposits.mockResolvedValue({
        deposits: [{
          deposit_data: {
            invoice: { encoded_payment_request: MOCK_INVOICE }
          },
          state: 'confirmed'
        }]
      });

      const response = await request(app)
        .post('/status')
        .send({ invoice: MOCK_INVOICE });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        invoice: MOCK_INVOICE,
        status: true
      });
    });

    it('should return 200 with status false when invoice is not paid', async () => {
      mockDeposits.mockResolvedValue({ deposits: [] });

      const response = await request(app)
        .post('/status')
        .send({ invoice: MOCK_INVOICE });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        invoice: MOCK_INVOICE,
        status: false
      });
    });

    it('should return 400 when invoice is missing', async () => {
      const response = await request(app)
        .post('/status')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.invoice).toBeDefined();
    });
  });

  describe('GET /callback', () => {
    it('should return 200 with valid amount in query', async () => {
      mockLightningNetworkInvoices.mockResolvedValue({
        invoice: { encoded_payment_request: MOCK_INVOICE }
      });

      const response = await request(app)
        .get('/callback')
        .query({ amount: 5000 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        pr: MOCK_INVOICE,
        successAction: {
          tag: 'message',
          message: 'Gracias por tu pago'
        },
        routes: []
      });
    });

    it('should return 200 with amount and comment', async () => {
      mockLightningNetworkInvoices.mockResolvedValue({
        invoice: { encoded_payment_request: MOCK_INVOICE }
      });

      const response = await request(app)
        .get('/callback')
        .query({ amount: 5000, comment: 'Custom memo' });

      expect(response.status).toBe(200);
      expect(response.body.pr).toBe(MOCK_INVOICE);
    });

    it('should return 400 when amount is missing', async () => {
      const response = await request(app)
        .get('/callback');

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.amount).toBeDefined();
    });

    it('should return 400 when amount is less than 1000', async () => {
      const response = await request(app)
        .get('/callback')
        .query({ amount: 500 });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
      expect(response.body.errors.amount).toBeDefined();
    });
  });
});
