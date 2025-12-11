const { pool2 } = require('../utils/db.util');

class ChatService {
    // Lưu tin nhắn mới
    static async saveLog(userId, sessionId, sender, message, intent = null) {
        try {
            const query = `
                INSERT INTO chat_logs (user_id, session_id, sender, message, intent_name, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            await pool2.query(query, [userId, sessionId, sender, message, intent]);
            return true;
        } catch (error) {
            console.error('Service Error (saveLog):', error);
            return false;
        }
    }

    // Lấy lịch sử chat
    static async getHistory(userId, limit = 50) {
        try {
            const query = `
                SELECT id, sender, message, created_at 
                FROM chat_logs 
                WHERE user_id = ? 
                ORDER BY created_at ASC 
                LIMIT ?
            `;
            const [rows] = await pool2.query(query, [userId, limit]);
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ChatService;