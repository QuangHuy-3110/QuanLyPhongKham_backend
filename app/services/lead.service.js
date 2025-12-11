const pool2 = require('../utils/db.util');

const LEAD_SCORING = {
    'book_appointment': 10,
    'ask_price': 8,
    'ask_doctor_info': 7,
    'provide_symptoms': 6
};

class LeadService {
    // Kiểm tra Intent và tạo/update Lead
    static async checkAndSaveLead(userId, intentName) {
        if (!LEAD_SCORING[intentName]) return; // Bỏ qua nếu không quan trọng

        const score = LEAD_SCORING[intentName];
        
        try {
            // 1. Check tồn tại
            const [existing] = await pool2.query("SELECT id FROM leads WHERE user_id = ? AND status = 'new'", [userId]);
            
            if (existing.length === 0) {
                // 2. Tạo mới
                await pool2.query(
                    "INSERT INTO leads (user_id, interest_topic, lead_score, created_at) VALUES (?, ?, ?, NOW())",
                    [userId, intentName, score]
                );
                console.log(`🎯 New Lead Detected: ${userId}`);
            } else {
                // 3. Update điểm
                await pool2.query(
                    "UPDATE leads SET lead_score = lead_score + 1, interest_topic = ? WHERE id = ?",
                    [intentName, existing[0].id]
                );
            }
        } catch (error) {
            console.error('Service Error (checkAndSaveLead):', error);
        }
    }

    // Lấy danh sách Lead cho Admin
    static async getAllLeads() {
        const query = `
            SELECT l.*, 
                   (SELECT message FROM chat_logs WHERE user_id = l.user_id ORDER BY created_at DESC LIMIT 1) as last_message
            FROM leads l
            ORDER BY l.lead_score DESC, l.created_at DESC
        `;
        const [rows] = await pool2.query(query);
        return rows;
    }
}

module.exports = LeadService;