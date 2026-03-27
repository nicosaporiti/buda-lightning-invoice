const { response } = require('express');
const { getInvoice } = require('../helpers/getInvoice');
const { getPaymentConfirmation } = require('../helpers/getPaymentConfirmation');

const newInvoice = async (req, res = response) => {
  const { amount, msg } = req.body;

  try {
    const invoice = await getInvoice(amount, msg);
    res.send({
      invoice,
      amount,
      msg,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
};

const paymentConfirmation = async (req, res = response) => {
  const { invoice } = req.body;

  try {
    const confirmed = await getPaymentConfirmation(invoice);
    res.send({
      invoice,
      status: confirmed,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
};

const lnurlp = (req, res = response) => {
  const domain = process.env.DOMAIN || req.get('host');
  const protocol = req.protocol;
  const metadata = JSON.stringify([['text/plain', `Pago Lightning a ${req.params.username}`]]);

  res.send({
    callback: `${protocol}://${domain}/callback`,
    maxSendable: 100000000,
    minSendable: 1000,
    metadata,
    tag: 'payRequest',
    commentAllowed: 140,
  });
};

const callback = async (req, res = response) => {
  const { amount, comment } = req.query;

  try {
    const memo = !comment ? 'Pago desde Lightning Address' : comment;
    const pr = await getInvoice(amount / 1000, memo);
    res.send({
      pr: pr,
      successAction: {
        tag: 'message',
        message: 'Gracias por tu pago',
      },
      routes: [],
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error.message,
    });
  }
};

module.exports = {
  newInvoice,
  paymentConfirmation,
  lnurlp,
  callback,
};
