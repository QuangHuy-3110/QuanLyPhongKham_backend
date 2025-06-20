const express = require('express');
const prescription = require('../controllers/prescription.controller');

const router = express.Router();

router.route('/')
    .get(prescription.findAll)
    .post(prescription.create)
    .delete(prescription.deleteAll);

router.route('/:maLanKham')
    .get(prescription.findOne)
    .put(prescription.update)
    .delete(prescription.delete);

module.exports = router;