const express = require('express');
const log = require('../controllers/log.controller');

const router = express.Router();

router.route('/')
    .get(log.findAll)
    .post(log.create)
    .delete(log.deleteAll);


router.route('/:id')
    .get(log.findOne)
    .put(log.update)
    .delete(log.delete);

module.exports = router;