const { response } = require('express');
const { getInvoice } = require('../helpers/getInvoice');

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

module.exports = {
  newInvoice,
};
