const express = require('express');
const record = require('../controllers/record.controller');

const router = express.Router();

router.route('/')
    .get(record.findAll)
    .post(record.create)
    .delete(record.deleteAll);


router.route('/:id')
    .get(record.findOne)
    .put(record.update)
    .delete(record.delete);

module.exports = router;