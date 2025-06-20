const express = require('express');
const examination = require('../controllers/examination.controller');

const router = express.Router();

router.route('/')
    .get(examination.findAll)
    .post(examination.create)
    .delete(examination.deleteAll);


router.route('/:id')
    .get(examination.findOne)
    .put(examination.update)
    .delete(examination.delete);

module.exports = router;