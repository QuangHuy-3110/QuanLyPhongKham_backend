const express = require('express');
const doctor = require('../controllers/doctor.controller');

const router = express.Router();

router.route('/')
    .get(doctor.findAll)
    .post(doctor.create)
    .delete(doctor.deleteAll);


router.route('/:id')
    .get(doctor.findOne)
    .put(doctor.update)
    .delete(doctor.delete);

module.exports = router;