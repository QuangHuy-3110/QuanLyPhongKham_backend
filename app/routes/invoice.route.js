const express = require('express');
const invoice = require('../controllers/invoice.controller');

const router = express.Router();

router.route('/')
    .get(invoice.findAll)
    .post(invoice.create)
    .delete(invoice.deleteAll);


router.route('/:id')
    .get(invoice.findOne)
    .put(invoice.update)
    .delete(invoice.delete);

module.exports = router;