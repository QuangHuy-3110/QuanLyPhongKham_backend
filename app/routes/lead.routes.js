const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/lead.controller');

// Định nghĩa route: GET /api/leads
router.get('/', LeadController.getLeads);

module.exports = router;