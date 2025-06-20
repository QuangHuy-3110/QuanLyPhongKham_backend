const express = require('express');
const drug = require('../controllers/drug.controller');

const router = express.Router();

router.route('/')
    .get(drug.findAll)
    .post(drug.create)
    .delete(drug.deleteAll);


router.route('/:id')
    .get(drug.findOne)
    .put(drug.update)
    .delete(drug.delete);

module.exports = router;