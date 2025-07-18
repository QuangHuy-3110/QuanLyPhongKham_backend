const express = require('express');
const distributor = require('../controllers/distributor.controller');

const router = express.Router();

router.route('/')
    .get(distributor.findAll)
    .post(distributor.create)
    .delete(distributor.deleteAll);


router.route('/:id')
    .get(distributor.findOne)
    .put(distributor.update)
    .delete(distributor.delete);

module.exports = router;