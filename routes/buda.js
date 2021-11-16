const { Router } = require('express');
const { check } = require('express-validator');
const { fieldsValidation } = require('../middlewares/fields-validator');
const router = Router();
const { newInvoice } = require('../controllers/buda');

router.post(
  '/newinvoice',
  [
    check('amount', 'Ingrese un número entero mayor a 1')
      .notEmpty()
      .isNumeric()
      .isInt({ min: 1 }),
    check('msg', 'Debe ingresar un mensaje').notEmpty().isLength({ min: 3 }),
  ],
  fieldsValidation,
  newInvoice
);

module.exports = router;
