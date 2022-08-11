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

const callback = async (req, res = response) => {
  const { amount, comment } = req.query;

  try {
    if (amount <= 0) {
      res.status(400).json({
        ok: false,
        error: 'Amount must be greater than 0',
      });
    }
    if (comment === '') {
      comment = 'Pago recibido por Lightning Address';
    }
    const pr = await getInvoice(amount, comment);
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
  callback
};
