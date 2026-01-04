const { validationResult } = require('express-validator');
const { fieldsValidation } = require('../../../middlewares/fields-validator');

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('fieldsValidation middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should call next() when validation passes', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true
    });

    fieldsValidation(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should return 400 with mapped errors when validation fails', () => {
    const mappedErrors = {
      amount: {
        msg: 'Amount is required',
        param: 'amount',
        location: 'body'
      }
    };

    validationResult.mockReturnValue({
      isEmpty: () => false,
      mapped: () => mappedErrors
    });

    fieldsValidation(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      ok: false,
      errors: mappedErrors
    });
  });

  it('should return multiple mapped errors when multiple validations fail', () => {
    const mappedErrors = {
      amount: {
        msg: 'Amount is required',
        param: 'amount',
        location: 'body'
      },
      msg: {
        msg: 'Message is required',
        param: 'msg',
        location: 'body'
      }
    };

    validationResult.mockReturnValue({
      isEmpty: () => false,
      mapped: () => mappedErrors
    });

    fieldsValidation(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      ok: false,
      errors: mappedErrors
    });
  });
});
