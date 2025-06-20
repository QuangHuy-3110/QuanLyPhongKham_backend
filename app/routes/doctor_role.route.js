const express = require('express');
const doctor_role = require('../controllers/doctor_role.controller');

const router = express.Router();

router.route('/')
    .get(doctor_role.findAll)
    .post(doctor_role.create)
    .delete(doctor_role.deleteAll);


router.route('/:maBS')
    .get(doctor_role.findOne)
    .put(doctor_role.update)
    .delete(doctor_role.delete);

module.exports = router;