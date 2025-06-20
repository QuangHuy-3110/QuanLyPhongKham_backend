const express = require('express');
const working_time = require('../controllers/working_time.controller');

const router = express.Router();

router.route('/')
    .get(working_time.findAll)
    .post(working_time.create)
    .delete(working_time.deleteAll);


router.route('/:maBS')
    .get(working_time.findOne)
    .put(working_time.update)
    .delete(working_time.delete);

module.exports = router;