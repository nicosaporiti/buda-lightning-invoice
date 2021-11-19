const getInvoice = (amount, msg) => {
  const apiKey = process.env.BUDA_API_KEY;
  const apiSecret = process.env.BUDA_API_SECRET;
  const Buda = require('../buda-promise/buda');
  const privateBuda = new Buda(apiKey, apiSecret);

  return privateBuda
    .lightning_network_invoices(amount, 'BTC', msg, false)
    .then((data) => {
      const invoice = data.invoice.encoded_payment_request;
      return invoice;
    });
};

module.exports = {
  getInvoice,
};
