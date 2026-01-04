const { getInvoice } = require('../../../helpers/getInvoice');
const { getPaymentConfirmation } = require('../../../helpers/getPaymentConfirmation');

jest.mock('../../../helpers/getInvoice');
jest.mock('../../../helpers/getPaymentConfirmation');

const { newInvoice, paymentConfirmation, callback } = require('../../../controllers/buda');

describe('Buda Controllers', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('newInvoice', () => {
    it('should return 200 with invoice, amount and msg on success', async () => {
      const mockInvoice = 'lnbc50u1test';
      getInvoice.mockResolvedValue(mockInvoice);
      mockReq = {
        body: { amount: 5000, msg: 'Test payment' }
      };

      await newInvoice(mockReq, mockRes);

      expect(getInvoice).toHaveBeenCalledWith(5000, 'Test payment');
      expect(mockRes.send).toHaveBeenCalledWith({
        invoice: mockInvoice,
        amount: 5000,
        msg: 'Test payment'
      });
    });

    it('should return 400 when helper fails', async () => {
      getInvoice.mockRejectedValue(new Error('API failed'));
      mockReq = {
        body: { amount: 5000, msg: 'Test' }
      };

      await newInvoice(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        ok: false,
        error: 'API failed'
      });
    });
  });

  describe('paymentConfirmation', () => {
    it('should return 200 with status true when paid', async () => {
      getPaymentConfirmation.mockResolvedValue(true);
      mockReq = {
        body: { invoice: 'lnbc50u1test' }
      };

      await paymentConfirmation(mockReq, mockRes);

      expect(getPaymentConfirmation).toHaveBeenCalledWith('lnbc50u1test');
      expect(mockRes.send).toHaveBeenCalledWith({
        invoice: 'lnbc50u1test',
        status: true
      });
    });

    it('should return 200 with status false when not paid', async () => {
      getPaymentConfirmation.mockResolvedValue(false);
      mockReq = {
        body: { invoice: 'lnbc50u1test' }
      };

      await paymentConfirmation(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith({
        invoice: 'lnbc50u1test',
        status: false
      });
    });

    it('should return 400 when helper fails', async () => {
      getPaymentConfirmation.mockRejectedValue(new Error('API failed'));
      mockReq = {
        body: { invoice: 'lnbc50u1test' }
      };

      await paymentConfirmation(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        ok: false,
        error: 'API failed'
      });
    });
  });

  describe('callback', () => {
    it('should convert millisatoshis to satoshis', async () => {
      const mockInvoice = 'lnbc5u1test';
      getInvoice.mockResolvedValue(mockInvoice);
      mockReq = {
        query: { amount: 5000000 } // 5000 satoshis in millisatoshis
      };

      await callback(mockReq, mockRes);

      expect(getInvoice).toHaveBeenCalledWith(5000, 'Pago desde Lightning Address');
    });

    it('should use default memo when no comment provided', async () => {
      getInvoice.mockResolvedValue('lnbc5u1test');
      mockReq = {
        query: { amount: 1000 }
      };

      await callback(mockReq, mockRes);

      expect(getInvoice).toHaveBeenCalledWith(1, 'Pago desde Lightning Address');
    });

    it('should use comment as memo when provided', async () => {
      getInvoice.mockResolvedValue('lnbc5u1test');
      mockReq = {
        query: { amount: 1000, comment: 'Custom memo' }
      };

      await callback(mockReq, mockRes);

      expect(getInvoice).toHaveBeenCalledWith(1, 'Custom memo');
    });

    it('should return valid LNURL structure', async () => {
      const mockInvoice = 'lnbc5u1test';
      getInvoice.mockResolvedValue(mockInvoice);
      mockReq = {
        query: { amount: 1000 }
      };

      await callback(mockReq, mockRes);

      expect(mockRes.send).toHaveBeenCalledWith({
        pr: mockInvoice,
        successAction: {
          tag: 'message',
          message: 'Gracias por tu pago'
        },
        routes: []
      });
    });

    it('should return 400 when helper fails', async () => {
      getInvoice.mockRejectedValue(new Error('API failed'));
      mockReq = {
        query: { amount: 1000 }
      };

      await callback(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        ok: false,
        error: 'API failed'
      });
    });
  });
});
