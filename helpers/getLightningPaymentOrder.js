const getLightningPaymentOrder = (market_id, amount, msg) => {
    const apiKey = process.env.BUDA_API_KEY;
    const apiSecret = process.env.BUDA_API_SECRET;
    const Buda = require('../buda-promise/buda');
    const privateBuda = new Buda(apiKey, apiSecret);
  
    return privateBuda
      .lightning_payment_order(market_id, amount, msg)
      .then((data) => {
        const invoice = data.order_data.invoice;
        return invoice;
      });
  };
  
  module.exports = {
    getLightningPaymentOrder,
  };