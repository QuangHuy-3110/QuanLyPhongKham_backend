const express = require('express');
const specialties = require('../controllers/specialties.controller');

const router = express.Router();

router.route('/')
    .get(specialties.findAll)
    .post(specialties.create)
    .delete(specialties.deleteAll);


router.route('/:id')
    .get(specialties.findOne)
    .put(specialties.update)
    .delete(specialties.delete);

module.exports = router;