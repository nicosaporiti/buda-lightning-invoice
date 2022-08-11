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
  callback,
};
