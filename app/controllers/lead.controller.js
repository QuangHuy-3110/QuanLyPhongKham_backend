const LeadService = require('../services/lead.service');

class LeadController {
    // API: GET /api/leads
    static async getLeads(req, res) {
        try {
            const leads = await LeadService.getAllLeads();
            res.status(200).json(leads);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi lấy danh sách leads', error: error.message });
        }
    }
}

module.exports = LeadController;