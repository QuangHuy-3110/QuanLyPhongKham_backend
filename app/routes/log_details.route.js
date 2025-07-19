const express = require('express');
const log_details = require('../controllers/log_details.controller');

const router = express.Router();

router.route('/')
    .get(log_details.findAll)
    .post(log_details.create)
    .delete(log_details.deleteAll);

router.route('/:maNK')
    .get(log_details.findOne)
    .put(log_details.update)
    .delete(log_details.delete);

module.exports = router;