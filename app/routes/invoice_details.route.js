const express = require('express');
const invoice_details = require('../controllers/invoice_details.controller');

const router = express.Router();

router.route('/')
    .get(invoice_details.findAll)
    .post(invoice_details.create)
    .delete(invoice_details.deleteAll);

router.route('/:maHD')
    .get(invoice_details.findOne)
    .put(invoice_details.update)
    .delete(invoice_details.delete);

module.exports = router;