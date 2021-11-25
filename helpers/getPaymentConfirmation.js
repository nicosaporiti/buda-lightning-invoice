const getPaymentConfirmation = (invoice) => {
  const apiKey = process.env.BUDA_API_KEY;
  const apiSecret = process.env.BUDA_API_SECRET;
  const Buda = require('../buda-promise/buda');
  const privateBuda = new Buda(apiKey, apiSecret);

  return privateBuda.deposits('btc').then((data) => {
    const payments = data.deposits.find(
      (e) =>
        e.deposit_data.invoice.encoded_payment_request === invoice &&
        e.state === 'confirmed'
    );

    return !!payments;
  });
};

module.exports = {
  getPaymentConfirmation,
};
