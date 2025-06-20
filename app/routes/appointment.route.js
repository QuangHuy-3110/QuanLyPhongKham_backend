const express = require('express');
const appointment = require('../controllers/appointment.controller');

const router = express.Router();

router.route('/')
    .get(appointment.findAll)
    .post(appointment.create)
    .delete(appointment.deleteAll);


router.route('/:id')
    .get(appointment.findOne)
    .put(appointment.update)
    .delete(appointment.delete);

module.exports = router;